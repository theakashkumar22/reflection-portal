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
import { Edit, Eye, Trash2, Type, List, ListOrdered, Code, Quote, Image } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

const COMMAND_ITEMS = [
  { icon: Type, name: "Text", description: "Just start writing", markdown: "" },
  { icon: List, name: "Bullet List", description: "Create a simple bullet list", markdown: "- " },
  { icon: ListOrdered, name: "Numbered List", description: "Create a numbered list", markdown: "1. " },
  { icon: Code, name: "Code Block", description: "Insert a code block", markdown: "```\n\n```" },
  { icon: Quote, name: "Quote", description: "Insert a quote", markdown: "> " },
  { icon: Image, name: "Image", description: "Insert an image", markdown: "![alt text](image-url)" },
];

export const NoteEditor: React.FC = () => {
  const { activeNote, updateNote, deleteNote } = useNotes();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [activeTab, setActiveTab] = useState<string>("edit");
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandMenuPosition, setCommandMenuPosition] = useState({ top: 0, left: 0 });
  const [filteredCommands, setFilteredCommands] = useState(COMMAND_ITEMS);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update local state when the active note changes
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
    } else {
      setTitle("");
      setContent("");
    }
  }, [activeNote]);

  // Save note when title or content changes (with debounce)
  useEffect(() => {
    if (!activeNote) return;

    const saveTimer = setTimeout(() => {
      if (title !== activeNote.title || content !== activeNote.content) {
        updateNote({
          ...activeNote,
          title,
          content,
        });
      }
    }, 500);

    return () => clearTimeout(saveTimer);
  }, [title, content, activeNote, updateNote]);

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
    }
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
        const cursorPos = lineStart + command.markdown.length;
        textareaRef.current.selectionStart = cursorPos;
        textareaRef.current.selectionEnd = cursorPos;
        textareaRef.current.focus();
      }
    }, 0);
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
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center border-b p-4 shrink-0">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-xl font-serif border-none h-auto px-0 focus-visible:ring-0 bg-transparent"
          placeholder="Note title..."
        />
        <div className="flex gap-2 ml-auto">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Note</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this note? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteNote(activeNote.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs
        defaultValue="edit"
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col h-full overflow-hidden"
      >
        <div className="px-4 border-b shrink-0">
          <TabsList className="h-10 mx-0">
            <TabsTrigger value="edit" className="flex items-center gap-1.5">
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit" className="flex-1 m-0 p-0 h-full overflow-hidden relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Start writing your note... (type '/' for commands)"
            className={cn(
              "h-full w-full resize-none rounded-none border-none focus-visible:ring-0 p-4",
              "font-mono text-sm"
            )}
          />
          
          {showCommandMenu && (
            <div 
              className="absolute z-10 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-md border dark:border-gray-700"
              style={{
                top: `${commandMenuPosition.top}px`,
                left: `${commandMenuPosition.left}px`
              }}
            >
              <div className="p-1">
                {filteredCommands.map((command, index) => (
                  <button
                    key={command.name}
                    className={cn(
                      "flex items-center w-full p-2 text-left rounded-sm",
                      "hover:bg-gray-100 dark:hover:bg-gray-700",
                      index === selectedCommandIndex && "bg-gray-100 dark:bg-gray-700"
                    )}
                    onClick={() => insertCommand(command)}
                  >
                    <command.icon className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">{command.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {command.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="preview" className="m-0 h-full overflow-hidden">
          <ScrollArea className="h-full w-full">
            <div className="p-6 prose prose-sm sm:prose-base lg:prose-lg max-w-full note-editor dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};