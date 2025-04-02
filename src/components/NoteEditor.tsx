import React, { useState, useEffect, useRef } from "react";
import { useNotes } from "@/context/NotesContext";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Edit, 
  Eye, 
  Trash2, 
  Type, 
  List, 
  ListOrdered, 
  Code, 
  Quote, 
  Image, 
  Bold, 
  Italic, 
  Link, 
  Table, 
  CheckSquare, 
  Calendar, 
  Save,
  History,
  Info,
  Search
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";

const COMMAND_ITEMS = [
  { icon: Type, name: "Text", description: "Just start writing", markdown: "" },
  { icon: Bold, name: "Bold", description: "Bold text", markdown: "**Bold text**" },
  { icon: Italic, name: "Italic", description: "Italic text", markdown: "*Italic text*" },
  { icon: List, name: "Bullet List", description: "Create a simple bullet list", markdown: "- " },
  { icon: ListOrdered, name: "Numbered List", description: "Create a numbered list", markdown: "1. " },
  { icon: CheckSquare, name: "Task List", description: "Create a task list", markdown: "- [ ] " },
  { icon: Code, name: "Code Block", description: "Insert a code block", markdown: "```\n\n```" },
  { icon: Quote, name: "Quote", description: "Insert a quote", markdown: "> " },
  { icon: Link, name: "Link", description: "Insert a link", markdown: "[Link text](url)" },
  { icon: Image, name: "Image", description: "Insert an image", markdown: "![alt text](image-url)" },
  { icon: Table, name: "Table", description: "Insert a table", markdown: "| Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |" },
  { icon: Calendar, name: "Date", description: "Insert current date", markdown: new Date().toLocaleDateString() },
];

// Color themes for notes
const NOTE_THEMES = [
  { name: "Default", bg: "bg-white dark:bg-gray-900", accent: "border-gray-200 dark:border-gray-700" },
  { name: "Green", bg: "bg-green-50 dark:bg-green-900/30", accent: "border-green-200 dark:border-green-800" },
  { name: "Blue", bg: "bg-blue-50 dark:bg-blue-900/30", accent: "border-blue-200 dark:border-blue-800" },
  { name: "Purple", bg: "bg-purple-50 dark:bg-purple-900/30", accent: "border-purple-200 dark:border-purple-800" },
  { name: "Amber", bg: "bg-amber-50 dark:bg-amber-900/30", accent: "border-amber-200 dark:border-amber-800" },
  { name: "Pink", bg: "bg-pink-50 dark:bg-pink-900/30", accent: "border-pink-200 dark:border-pink-800" },
];

export const NoteEditor = () => {
  const { activeNote, updateNote, deleteNote } = useNotes();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [activeTab, setActiveTab] = useState("edit");
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandMenuPosition, setCommandMenuPosition] = useState({ top: 0, left: 0 });
  const [filteredCommands, setFilteredCommands] = useState(COMMAND_ITEMS);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchMatches, setSearchMatches] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState(NOTE_THEMES[0]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [revisionHistory, setRevisionHistory] = useState<{timestamp: number, content: string}[]>([]);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Update local state when the active note changes
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
      setTags(activeNote.tags || []);
      setSelectedTheme(NOTE_THEMES.find(t => t.name === activeNote.theme) || NOTE_THEMES[0]);
      
      // Initialize revision history
      if (activeNote.revisions) {
        setRevisionHistory(activeNote.revisions);
      } else {
        setRevisionHistory([{ timestamp: Date.now(), content: activeNote.content }]);
      }
      
      // Reset search and command menu
      setShowCommandMenu(false);
      setShowSearch(false);
      setSearchTerm("");
    } else {
      setTitle("");
      setContent("");
      setTags([]);
      setSelectedTheme(NOTE_THEMES[0]);
      setRevisionHistory([]);
    }
  }, [activeNote]);

  // Update word and character counts
  useEffect(() => {
    if (content) {
      setCharCount(content.length);
      setWordCount(content.trim() === "" ? 0 : content.trim().split(/\s+/).length);
    } else {
      setCharCount(0);
      setWordCount(0);
    }
  }, [content]);

  // Save note with debounce when autoSave is enabled
  useEffect(() => {
    if (!activeNote || !autoSaveEnabled) return;

    const saveTimer = setTimeout(() => {
      if (title !== activeNote.title || content !== activeNote.content || 
          JSON.stringify(tags) !== JSON.stringify(activeNote.tags || []) ||
          selectedTheme.name !== (activeNote.theme || 'Default')) {
        
        // Add to revision history if content changed significantly
        let newRevisions = [...revisionHistory];
        if (content !== activeNote.content && 
            // Only record a new revision if content changed by more than 10% or after 5 minutes
            (Math.abs(content.length - activeNote.content.length) > activeNote.content.length * 0.1 ||
             Date.now() - (revisionHistory[revisionHistory.length - 1]?.timestamp || 0) > 5 * 60 * 1000)) {
          newRevisions = [...newRevisions, { timestamp: Date.now(), content }];
          // Keep only the last 10 revisions
          if (newRevisions.length > 10) {
            newRevisions = newRevisions.slice(newRevisions.length - 10);
          }
          setRevisionHistory(newRevisions);
        }
        
        updateNote({
          ...activeNote,
          title,
          content,
          tags,
          theme: selectedTheme.name,
          revisions: newRevisions,
          updatedAt: new Date().toISOString(),
        });
        
        setLastSaved(new Date());
      }
    }, 1000);

    return () => clearTimeout(saveTimer);
  }, [title, content, tags, selectedTheme, activeNote, updateNote, autoSaveEnabled, revisionHistory]);

  // Handle manual save
  const handleManualSave = () => {
    if (!activeNote) return;
    
    const newRevisions = [...revisionHistory, { timestamp: Date.now(), content }];
    updateNote({
      ...activeNote,
      title,
      content,
      tags,
      theme: selectedTheme.name,
      revisions: newRevisions,
      updatedAt: new Date().toISOString(),
    });
    
    setLastSaved(new Date());
    setRevisionHistory(newRevisions);
    
    toast({
      title: "Note saved",
      description: `"${title}" was saved successfully.`,
      duration: 3000,
    });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    // Check for slash command
    if (value[value.length - 1] === '/' && !showCommandMenu) {
      const textarea = textareaRef.current;
      if (textarea) {
        const cursorPosition = textarea.selectionStart;
        const rect = textarea.getBoundingClientRect();
        const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
        const lines = value.substr(0, cursorPosition).split('\n');
        const currentLine = lines[lines.length - 1];
        
        setCommandMenuPosition({
          top: rect.top + (lines.length * lineHeight) + 10,
          left: rect.left + (currentLine.length * 8) // Approximate character width
        });
        setShowCommandMenu(true);
        setFilteredCommands(COMMAND_ITEMS);
        setSelectedCommandIndex(0);
      }
    } else if (showCommandMenu) {
      const lines = value.split('\n');
      const currentLine = lines[lines.length - 1];
      
      if (currentLine.startsWith('/')) {
        const searchTerm = currentLine.substring(1).toLowerCase();
        setFilteredCommands(
          COMMAND_ITEMS.filter(cmd => 
            cmd.name.toLowerCase().includes(searchTerm) || 
            cmd.description.toLowerCase().includes(searchTerm)
          )
        );
      } else {
        setShowCommandMenu(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Save shortcut (Ctrl+S / Cmd+S)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleManualSave();
      return;
    }
    
    // Search shortcut (Ctrl+F / Cmd+F)
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      setShowSearch(true);
      setTimeout(() => searchInputRef.current?.focus(), 0);
      return;
    }
    
    if (showCommandMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommandIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommandIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        insertCommand(filteredCommands[selectedCommandIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowCommandMenu(false);
      }
    } else if (showSearch && e.key === 'Escape') {
      e.preventDefault();
      setShowSearch(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term) {
      const regex = new RegExp(term, 'gi');
      const matches = (content.match(regex) || []).length;
      setSearchMatches(matches);
      setCurrentMatchIndex(matches > 0 ? 1 : 0);
      
      // Highlight matches in the textarea
      highlightMatches(term);
    } else {
      setSearchMatches(0);
      setCurrentMatchIndex(0);
      
      // Remove highlighting
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };
  
  const highlightMatches = (term: string) => {
    if (!textareaRef.current || !term) return;
    
    const textarea = textareaRef.current;
    const text = textarea.value;
    const regex = new RegExp(term, 'gi');
    let match;
    let matches = [];
    
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + term.length
      });
    }
    
    if (matches.length > 0 && currentMatchIndex <= matches.length) {
      const currentMatch = matches[currentMatchIndex - 1];
      textarea.focus();
      textarea.setSelectionRange(currentMatch.start, currentMatch.end);
      
      // Scroll to the match
      const lines = text.substr(0, currentMatch.start).split('\n');
      const approxLineHeight = parseInt(getComputedStyle(textarea).lineHeight);
      textarea.scrollTop = (lines.length - 1) * approxLineHeight;
    }
  };
  
  const navigateSearch = (direction: 'next' | 'prev') => {
    if (searchMatches === 0) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = currentMatchIndex >= searchMatches ? 1 : currentMatchIndex + 1;
    } else {
      newIndex = currentMatchIndex <= 1 ? searchMatches : currentMatchIndex - 1;
    }
    
    setCurrentMatchIndex(newIndex);
    highlightMatches(searchTerm);
  };
  
  const insertCommand = (command: typeof COMMAND_ITEMS[0]) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const currentValue = textarea.value;
    
    // Find the start of the current line
    let lineStart = startPos;
    while (lineStart > 0 && currentValue[lineStart - 1] !== '\n') {
      lineStart--;
    }
    
    // Replace the slash command with the markdown
    const newValue = 
      currentValue.substring(0, lineStart) + 
      command.markdown + 
      currentValue.substring(endPos);
    
    setContent(newValue);
    setShowCommandMenu(false);
    
    // Focus and position cursor
    setTimeout(() => {
      if (textareaRef.current) {
        let cursorPos = lineStart + command.markdown.length;
        
        // For commands with placeholders (like code blocks), position cursor between the backticks
        if (command.markdown.includes('\n\n')) {
          cursorPos = lineStart + command.markdown.indexOf('\n\n') + 1;
        }
        
        textareaRef.current.selectionStart = cursorPos;
        textareaRef.current.selectionEnd = cursorPos;
        textareaRef.current.focus();
      }
    }, 0);
  };
  
  const handleToolbarCommand = (markdown: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const selectedText = textarea.value.substring(startPos, endPos);
    const currentValue = textarea.value;
    
    let newValue;
    let newCursorPos;
    
    // Handle different markdown insertions based on selection
    if (selectedText) {
      // If text is selected, wrap it with the markdown
      if (markdown === "**Bold text**") {
        newValue = 
          currentValue.substring(0, startPos) + 
          "**" + selectedText + "**" + 
          currentValue.substring(endPos);
        newCursorPos = endPos + 4; // Position after the closing **
      } else if (markdown === "*Italic text*") {
        newValue = 
          currentValue.substring(0, startPos) + 
          "*" + selectedText + "*" + 
          currentValue.substring(endPos);
        newCursorPos = endPos + 2; // Position after the closing *
      } else if (markdown === "[Link text](url)") {
        newValue = 
          currentValue.substring(0, startPos) + 
          "[" + selectedText + "](url)" + 
          currentValue.substring(endPos);
        newCursorPos = endPos + 3; // Position at the 'u' in url
      } else if (markdown.startsWith("```")) {
        newValue = 
          currentValue.substring(0, startPos) + 
          "```\n" + selectedText + "\n```" + 
          currentValue.substring(endPos);
        newCursorPos = endPos + 6; // Position after the closing ```
      } else if (markdown.startsWith(">")) {
        newValue = 
          currentValue.substring(0, startPos) + 
          "> " + selectedText + 
          currentValue.substring(endPos);
        newCursorPos = endPos + 2; // Position after the >
      } else {
        // For simple prefixes like lists
        newValue = 
          currentValue.substring(0, startPos) + 
          markdown + selectedText + 
          currentValue.substring(endPos);
        newCursorPos = endPos + markdown.length;
      }
    } else {
      // If no text is selected, just insert the markdown
      newValue = 
        currentValue.substring(0, startPos) + 
        markdown + 
        currentValue.substring(endPos);
      newCursorPos = startPos + markdown.length;
      
      // For code blocks or tables, position cursor appropriately
      if (markdown.includes('\n\n')) {
        newCursorPos = startPos + markdown.indexOf('\n\n') + 1;
      }
    }
    
    setContent(newValue);
    
    // Set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = newCursorPos;
        textareaRef.current.selectionEnd = newCursorPos;
        textareaRef.current.focus();
      }
    }, 0);
  };
  
  const handleThemeChange = (theme: typeof NOTE_THEMES[0]) => {
    setSelectedTheme(theme);
  };
  
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()]);
      }
      setNewTag("");
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const restoreRevision = (revision: {timestamp: number, content: string}) => {
    // Add current content as a revision before restoring
    const newRevisions = [...revisionHistory, { timestamp: Date.now(), content }];
    setContent(revision.content);
    setRevisionHistory(newRevisions);
    
    toast({
      title: "Revision restored",
      description: `Revision from ${new Date(revision.timestamp).toLocaleString()} has been restored.`,
      duration: 3000,
    });
  };

  if (!activeNote) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-serif mb-2">No Note Selected</h2>
          <p className="text-muted-foreground">
            Select a note from the sidebar or create a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex-1 flex flex-col h-full overflow-hidden",
      selectedTheme.bg
    )}>
      <div className={cn(
        "flex items-center border-b p-4 shrink-0",
        selectedTheme.accent
      )}>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-xl font-serif border-none h-auto px-0 focus-visible:ring-0 bg-transparent"
          placeholder="Note title..."
        />
        
        <div className="flex gap-2 ml-auto">
          <TooltipProvider>
            {/* Save Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleManualSave}
                  className="transition-all"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save Note (Ctrl+S)</p>
                {lastSaved && (
                  <p className="text-xs text-muted-foreground">
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
            
            {/* Search Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    setShowSearch(!showSearch);
                    if (!showSearch) {
                      setTimeout(() => searchInputRef.current?.focus(), 0);
                    }
                  }}
                  className={cn(showSearch && "bg-muted")}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Search in Note (Ctrl+F)</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Info/Metadata Button */}
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline" size="icon">
                  <Info className="h-4 w-4" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Note Information</DrawerTitle>
                  <DrawerDescription>
                    View and edit note metadata
                  </DrawerDescription>
                </DrawerHeader>
                <div className="p-4 space-y-4">
                  {/* Tags */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Tags</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsEditingTags(!isEditingTags)}
                      >
                        {isEditingTags ? "Done" : "Edit"}
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => (
                        <Badge key={tag} className="flex items-center gap-1">
                          {tag}
                          {isEditingTags && (
                            <button 
                              onClick={() => handleRemoveTag(tag)} 
                              className="ml-1 text-xs hover:text-red-500"
                            >
                              ×
                            </button>
                          )}
                        </Badge>
                      ))}
                      
                      {isEditingTags && (
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={handleAddTag}
                          placeholder="Add tag..."
                          className="text-sm h-8"
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Theme Selector */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Note Theme</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {NOTE_THEMES.map(theme => (
                        <button
                          key={theme.name}
                          onClick={() => handleThemeChange(theme)}
                          className={cn(
                            "h-12 rounded-md border transition-all",
                            theme.bg,
                            theme.accent,
                            selectedTheme.name === theme.name && "ring-2 ring-offset-2 ring-primary"
                          )}
                        >
                          <span className="sr-only">{theme.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Statistics */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Statistics</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-md bg-muted p-2">
                        <div className="text-xs text-muted-foreground">Words</div>
                        <div className="text-lg font-medium">{wordCount}</div>
                      </div>
                      <div className="rounded-md bg-muted p-2">
                        <div className="text-xs text-muted-foreground">Characters</div>
                        <div className="text-lg font-medium">{charCount}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Auto-save toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium">Auto-save</h3>
                      <p className="text-xs text-muted-foreground">
                        Automatically save changes
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoSaveEnabled}
                        onChange={() => setAutoSaveEnabled(!autoSaveEnabled)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button variant="outline">Close</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
            
            {/* History Button */}
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline" size="icon">
                  <History className="h-4 w-4" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Revision History</DrawerTitle>
                  <DrawerDescription>
                    View and restore previous versions of this note
                  </DrawerDescription>
                </DrawerHeader>
                <ScrollArea className="h-[400px] p-4">
                  {revisionHistory.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No revisions available
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {revisionHistory.map((revision, index) => (
                        <div 
                          key={revision.timestamp} 
                          className="border rounded-md p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {index === revisionHistory.length - 1 
                                ? "Current Version" 
                                : `Revision ${revisionHistory.length - index}`}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(revision.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-xs line-clamp-3 text-muted-foreground font-mono bg-muted p-2 rounded">
                            {revision.content.slice(0, 150)}{revision.content.length > 150 ? "..." : ""}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={index === revisionHistory.length - 1}
                            onClick={() => restoreRevision(revision)}
                          >
                            Restore this version
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button variant="outline">Close</Button>
                  </DrawerClose>
                </DrawerFooter>
                </DrawerContent>
                </Drawer>
                        {/* Delete Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="icon" className="hover:bg-red-500/10 hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the note "{title}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteNote(activeNote.id)}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete Note
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TooltipProvider>
    </div>
  </div>

  {/* Search Bar */}
  {showSearch && (
    <div className={cn(
      "flex items-center gap-2 border-b p-2",
      selectedTheme.accent
    )}>
      <Search className="h-4 w-4 text-muted-foreground" />
      <Input
        ref={searchInputRef}
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Search in note..."
        className="border-none bg-transparent focus-visible:ring-0"
      />
      {searchTerm && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {currentMatchIndex > 0 ? `${currentMatchIndex} of ${searchMatches}` : 'No matches'}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => navigateSearch('prev')}
            disabled={searchMatches === 0}
          >
            ↑
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => navigateSearch('next')}
            disabled={searchMatches === 0}
          >
            ↓
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-2"
            onClick={() => {
              setShowSearch(false);
              setSearchTerm("");
            }}
          >
            ×
          </Button>
        </div>
      )}
    </div>
  )}

  {/* Markdown Toolbar */}
  <div className={cn(
    "flex items-center gap-1 border-b p-1 overflow-x-auto",
    selectedTheme.accent
  )}>
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={() => handleToolbarCommand("**Bold text**")}
      className="h-8 w-8"
    >
      <Bold className="h-4 w-4" />
    </Button>
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={() => handleToolbarCommand("*Italic text*")}
      className="h-8 w-8"
    >
      <Italic className="h-4 w-4" />
    </Button>
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={() => handleToolbarCommand("- ")}
      className="h-8 w-8"
    >
      <List className="h-4 w-4" />
    </Button>
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={() => handleToolbarCommand("1. ")}
      className="h-8 w-8"
    >
      <ListOrdered className="h-4 w-4" />
    </Button>
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={() => handleToolbarCommand("- [ ] ")}
      className="h-8 w-8"
    >
      <CheckSquare className="h-4 w-4" />
    </Button>
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={() => handleToolbarCommand("```\n\n```")}
      className="h-8 w-8"
    >
      <Code className="h-4 w-4" />
    </Button>
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={() => handleToolbarCommand("> ")}
      className="h-8 w-8"
    >
      <Quote className="h-4 w-4" />
    </Button>
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={() => handleToolbarCommand("[Link text](url)")}
      className="h-8 w-8"
    >
      <Link className="h-4 w-4" />
    </Button>
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={() => handleToolbarCommand("![alt text](image-url)")}
      className="h-8 w-8"
    >
      <Image className="h-4 w-4" />
    </Button>
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={() => handleToolbarCommand("| Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |")}
      className="h-8 w-8"
    >
      <Table className="h-4 w-4" />
    </Button>
  </div>

  {/* Editor/Preview Tabs */}
  <Tabs 
    value={activeTab} 
    onValueChange={setActiveTab}
    className="flex-1 flex flex-col overflow-hidden"
  >
    <TabsList className="rounded-none border-b bg-transparent p-0">
      <TabsTrigger 
        value="edit" 
        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary h-12 px-6"
      >
        <Edit className="h-4 w-4 mr-2" />
        Edit
      </TabsTrigger>
      <TabsTrigger 
        value="preview" 
        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary h-12 px-6"
      >
        <Eye className="h-4 w-4 mr-2" />
        Preview
      </TabsTrigger>
    </TabsList>
    
    <TabsContent value="edit" className="flex-1 overflow-hidden">
      <ScrollArea className="h-full w-full">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          className="min-h-[calc(100vh-200px)] w-full border-none rounded-none focus-visible:ring-0 p-6 font-mono text-lg resize-none"
          placeholder="Start writing here... Use '/' for commands"
        />
      </ScrollArea>
    </TabsContent>
    
    <TabsContent value="preview" className="flex-1 overflow-hidden">
      <ScrollArea className="h-full w-full p-6">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          className="prose dark:prose-invert max-w-none"
        >
          {content || "*Nothing to preview*"}
        </ReactMarkdown>
      </ScrollArea>
    </TabsContent>
  </Tabs>

  {/* Status Bar */}
  <div className={cn(
    "flex items-center justify-between px-4 py-2 text-xs text-muted-foreground border-t",
    selectedTheme.accent
  )}>
    <div>
      {activeNote.updatedAt && (
        <span>Last updated: {new Date(activeNote.updatedAt).toLocaleString()}</span>
      )}
    </div>
    <div className="flex items-center gap-4">
      <span>{wordCount} words</span>
      <span>{charCount} characters</span>
      {autoSaveEnabled && (
        <span className="flex items-center gap-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Auto-save
        </span>
      )}
    </div>
  </div>

  {/* Command Menu */}
  {showCommandMenu && (
    <div 
      className="fixed z-50 w-64 bg-popover text-popover-foreground rounded-md shadow-lg border"
      style={{
        top: commandMenuPosition.top,
        left: commandMenuPosition.left
      }}
    >
      <div className="p-1">
        {filteredCommands.map((command, index) => (
          <button
            key={command.name}
            className={cn(
              "w-full text-left p-2 rounded-sm flex items-center gap-2",
              index === selectedCommandIndex && "bg-accent"
            )}
            onClick={() => insertCommand(command)}
          >
            <command.icon className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">{command.name}</div>
              <div className="text-xs text-muted-foreground">{command.description}</div>
            </div>
          </button>
        ))}
        {filteredCommands.length === 0 && (
          <div className="p-2 text-sm text-muted-foreground">
            No commands found
          </div>
        )}
      </div>
    </div>
  )}
</div>
);
};