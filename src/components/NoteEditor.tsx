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
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Link,
  Image,
  Code,
  Quote,
  Edit,
  Eye, 
  FileDown,
  Heading1,
  Heading2,
  Heading3,
  Trash2,
  Undo,
  Redo,
  PanelRight
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import html2pdf from "html2pdf.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

export const NoteEditor: React.FC = () => {
  const { activeNote, updateNote, deleteNote } = useNotes();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [activeTab, setActiveTab] = useState<string>("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const { toast } = useToast();

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
      setHistory([activeNote.content]);
      setHistoryIndex(0);
    } else {
      setTitle("");
      setContent("");
      setHistory([]);
      setHistoryIndex(-1);
    }
  }, [activeNote]);

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

  useEffect(() => {
    if (!activeNote || !content) return;
    
    const historyTimer = setTimeout(() => {
      if (history[historyIndex] !== content) {
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, content]);
        setHistoryIndex(newHistory.length);
      }
    }, 1000);

    return () => clearTimeout(historyTimer);
  }, [content]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setContent(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setContent(history[historyIndex + 1]);
    }
  };

  const insertAtCursor = (before: string, after: string = "") => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    
    setContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = selectedText.length > 0 
        ? start + before.length + selectedText.length 
        : start + before.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertHeading = (level: number) => {
    const prefix = "#".repeat(level) + " ";
    insertAtCursor(prefix);
  };

  const exportToPdf = () => {
    if (!activeNote || !previewRef.current) return;

    const clonedPreview = previewRef.current.cloneNode(true) as HTMLElement;
    
    const titleElement = document.createElement("h1");
    titleElement.textContent = title;
    titleElement.style.marginBottom = "20px";
    clonedPreview.insertBefore(titleElement, clonedPreview.firstChild);

    const options = {
      margin: 10,
      filename: `${title || 'note'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(clonedPreview).set(options).save();
    
    toast({
      title: "PDF Exported",
      description: `"${title}" has been exported as PDF.`
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
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center border-b p-4 shrink-0">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-xl font-serif border-none h-auto px-0 focus-visible:ring-0 bg-transparent"
          placeholder="Note title..."
        />
        <div className="flex gap-2 ml-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={exportToPdf}
              >
                <FileDown className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export as PDF</TooltipContent>
          </Tooltip>
          
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
          <div className="flex justify-between items-center">
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
            
            {activeTab === "edit" && (
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                >
                  <Redo className="h-4 w-4" />
                </Button>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        const selectedText = textareaRef.current?.value.substring(
                          textareaRef.current.selectionStart,
                          textareaRef.current.selectionEnd
                        ) || "";
                        
                        if (selectedText) {
                          insertAtCursor("**", "**");
                        } else {
                          insertAtCursor("**", "**");
                        }
                      }}
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Bold</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        const selectedText = textareaRef.current?.value.substring(
                          textareaRef.current.selectionStart,
                          textareaRef.current.selectionEnd
                        ) || "";
                        
                        if (selectedText) {
                          insertAtCursor("*", "*");
                        } else {
                          insertAtCursor("*", "*");
                        }
                      }}
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Italic</TooltipContent>
                </Tooltip>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Heading1 className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => insertHeading(1)}>
                      <Heading1 className="h-4 w-4 mr-2" />
                      Heading 1
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => insertHeading(2)}>
                      <Heading2 className="h-4 w-4 mr-2" />
                      Heading 2
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => insertHeading(3)}>
                      <Heading3 className="h-4 w-4 mr-2" />
                      Heading 3
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => insertAtCursor("\n- ")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Bullet List</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => insertAtCursor("\n1. ")}
                    >
                      <ListOrdered className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Numbered List</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        const selectedText = textareaRef.current?.value.substring(
                          textareaRef.current.selectionStart,
                          textareaRef.current.selectionEnd
                        ) || "";
                        
                        if (selectedText) {
                          insertAtCursor("[" + selectedText + "](", ")");
                        } else {
                          insertAtCursor("[", "](url)");
                        }
                      }}
                    >
                      <Link className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Link</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => insertAtCursor("![alt text](", ")")}
                    >
                      <Image className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Image</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => insertAtCursor("\n```\n", "\n```\n")}
                    >
                      <Code className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Code Block</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => insertAtCursor("\n> ")}
                    >
                      <Quote className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Blockquote</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </div>

        <TabsContent value="edit" className="flex-1 m-0 p-0 h-full overflow-hidden">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing your note..."
            className={cn(
              "h-full w-full resize-none rounded-none border-none focus-visible:ring-0 p-4",
              "font-mono text-sm"
            )}
          />
        </TabsContent>

        <TabsContent value="preview" className="m-0 h-full overflow-hidden">
          <ScrollArea className="h-full w-full">
            <div ref={previewRef} className="p-6 prose prose-sm sm:prose-base lg:prose-lg max-w-full note-editor">
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
