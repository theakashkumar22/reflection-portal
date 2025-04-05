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
  Table,
  FilePlus
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const NoteEditor: React.FC = () => {
  const { activeNote, updateNote, deleteNote, createNote } = useNotes();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [activeTab, setActiveTab] = useState<string>("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const { toast } = useToast();

  // Dialog states
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      // Auto-continue lists
      const textarea = e.currentTarget;
      const { selectionStart } = textarea;
      const currentLine = content.substring(0, selectionStart).split('\n').pop() || '';
      
      // Check for bullet points
      const bulletMatch = currentLine.match(/^(\s*)([-*+])\s/);
      if (bulletMatch) {
        // If the line is empty except for the bullet, remove the bullet
        if (currentLine.trim() === `${bulletMatch[2]} `) {
          e.preventDefault();
          const beforeBullet = content.substring(0, selectionStart - bulletMatch[0].length);
          const afterBullet = content.substring(selectionStart);
          setContent(beforeBullet + afterBullet);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = beforeBullet.length;
          }, 0);
          return;
        }
        
        e.preventDefault();
        const indent = bulletMatch[1];
        const bullet = bulletMatch[2];
        const insertion = `\n${indent}${bullet} `;
        insertAtCursor(insertion, '');
        return;
      }
      
      // Check for numbered lists
      const numberedMatch = currentLine.match(/^(\s*)(\d+)\.\s/);
      if (numberedMatch) {
        // If the line is empty except for the number, remove the numbered item
        if (currentLine.trim() === `${numberedMatch[2]}. `) {
          e.preventDefault();
          const beforeNumber = content.substring(0, selectionStart - numberedMatch[0].length);
          const afterNumber = content.substring(selectionStart);
          setContent(beforeNumber + afterNumber);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = beforeNumber.length;
          }, 0);
          return;
        }
        
        e.preventDefault();
        const indent = numberedMatch[1];
        const num = parseInt(numberedMatch[2]) + 1;
        const insertion = `\n${indent}${num}. `;
        insertAtCursor(insertion, '');
        return;
      }
    }

    // Handle tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      insertAtCursor('  ', '');
    }
  };

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
    
    // Position cursor between formatting marks if no text is selected
    setTimeout(() => {
      textarea.focus();
      if (selectedText.length === 0 && after) {
        // If no text is selected and there's an "after" part, put cursor in the middle
        const newCursorPos = start + before.length;
        textarea.selectionStart = textarea.selectionEnd = newCursorPos;
      } else {
        // If text is selected, position cursor after the selected text and formatting
        const newCursorPos = start + before.length + selectedText.length + after.length;
        textarea.selectionStart = textarea.selectionEnd = newCursorPos;
      }
    }, 0);
  };

  const insertHeading = (level: number) => {
    const prefix = "#".repeat(level) + " ";
    insertAtCursor(prefix);
  };

  const handleInsertImage = () => {
    if (imageUrl.trim()) {
      const imageMarkdown = `![${imageAlt || 'image'}](${imageUrl})`;
      insertAtCursor(imageMarkdown, '');
      setImageDialogOpen(false);
      setImageUrl('');
      setImageAlt('');
    }
  };

  const handleInsertTable = () => {
    if (tableRows > 0 && tableCols > 0) {
      let tableMarkdown = '\n';
      
      // Create header row
      const headerRow = '| ' + Array(tableCols).fill('Header').join(' | ') + ' |';
      tableMarkdown += headerRow + '\n';
      
      // Create separator row
      const separatorRow = '| ' + Array(tableCols).fill('---').join(' | ') + ' |';
      tableMarkdown += separatorRow + '\n';
      
      // Create data rows
      for (let i = 0; i < tableRows - 1; i++) {
        const dataRow = '| ' + Array(tableCols).fill('Cell').join(' | ') + ' |';
        tableMarkdown += dataRow + '\n';
      }
      
      insertAtCursor(tableMarkdown, '');
      setTableDialogOpen(false);
      setTableRows(3);
      setTableCols(3);
    }
  };

  const handleCreateNewNote = () => {
    // Create a new note in the same folder as the current note
    const folderId = activeNote ? activeNote.folderId : null;
    createNote(folderId);
    
    toast({
      title: "New Note Created",
      description: folderId ? "Created in the current folder" : "Created in root"
    });
  };

  const exportToPdf = () => {
    if (!activeNote || !previewRef.current) return;

    // Clone the preview content for PDF export
    const clonedPreview = previewRef.current.cloneNode(true) as HTMLElement;
    
    // Enhance the styles for PDF export
    const images = clonedPreview.querySelectorAll('img');
    images.forEach((img) => {
      (img as HTMLElement).setAttribute('style', 'max-width: 100%; height: auto; margin: 1rem 0;');
    });
    
    const tables = clonedPreview.querySelectorAll('table');
    tables.forEach((table) => {
      (table as HTMLElement).setAttribute('style', 'width: 100%; border-collapse: collapse; margin: 1rem 0;');
      
      const cells = table.querySelectorAll('th, td');
      cells.forEach((cell) => {
        cell.setAttribute('style', 'border: 1px solid #ddd; padding: 8px; text-align: left;');
      });
      
      const headerCells = table.querySelectorAll('th');
      headerCells.forEach((cell) => {
        (cell as HTMLElement).setAttribute('style', 'background-color: #f2f2f2; border: 1px solid #ddd; padding: 8px; text-align: left;');
      });
    });
    
    const lists = clonedPreview.querySelectorAll('ul, ol');
    lists.forEach((list) => {
      list.setAttribute('style', 'padding-left: 2rem; margin: 1rem 0;');
    });

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
                onClick={handleCreateNewNote}
              >
                <FilePlus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Create New Note</TooltipContent>
          </Tooltip>
          
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
          <div className="flex flex-wrap justify-between items-center">
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
              <div className="flex flex-wrap items-center gap-1 my-1">
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
                        const textarea = textareaRef.current;
                        const selectedText = textarea?.value.substring(
                          textarea.selectionStart,
                          textarea.selectionEnd
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
                        const textarea = textareaRef.current;
                        const selectedText = textarea?.value.substring(
                          textarea.selectionStart,
                          textarea.selectionEnd
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
                        const textarea = textareaRef.current;
                        const selectedText = textarea?.value.substring(
                          textarea.selectionStart,
                          textarea.selectionEnd
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
                      onClick={() => setImageDialogOpen(true)}
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
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setTableDialogOpen(true)}
                    >
                      <Table className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Table</TooltipContent>
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
            onKeyDown={handleKeyDown}
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
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  img: ({node, ...props}) => (
                    <div className="my-4 flex justify-center">
                      <img 
                        {...props} 
                        className="rounded-md max-w-full max-h-[500px] object-contain shadow-sm" 
                        style={{display: 'block'}}
                        alt={props.alt || 'Image'}
                      />
                    </div>
                  ),
                  table: ({node, ...props}) => (
                    <div className="my-6 overflow-x-auto">
                      <table 
                        {...props} 
                        className="min-w-full border divide-y divide-gray-300 rounded-md" 
                      />
                    </div>
                  ),
                  thead: ({node, ...props}) => (
                    <thead {...props} className="bg-muted" />
                  ),
                  th: ({node, ...props}) => (
                    <th 
                      {...props} 
                      className="py-3 px-4 text-left text-sm font-semibold border-b border-r last:border-r-0" 
                    />
                  ),
                  td: ({node, ...props}) => (
                    <td 
                      {...props} 
                      className="py-2 px-4 text-sm border-b border-r last:border-r-0" 
                    />
                  ),
                  ul: ({node, ...props}) => (
                    <ul {...props} className="list-disc pl-6 my-4 space-y-2" />
                  ),
                  ol: ({node, ...props}) => (
                    <ol {...props} className="list-decimal pl-6 my-4 space-y-2" />
                  ),
                  li: ({node, ...props}) => (
                    <li {...props} className="pl-1 py-1" />
                  ),
                  p: ({node, ...props}) => {
                    let parentTagName = '';
                    
                    try {
                      const parentInfo = (node as any)?.__parent || (node as any)?.parent;
                      if (parentInfo && typeof parentInfo.tagName === 'string') {
                        parentTagName = parentInfo.tagName.toLowerCase();
                      }
                    } catch (e) {
                    }
                    
                    if (["li", "th", "td"].includes(parentTagName)) {
                      return <>{props.children}</>;
                    }
                    
                    return <p {...props} className="my-2 whitespace-pre-line" />;
                  },
                  code: ({node, className, children, ...props}) => {
                    const isInline = (props as any).inline === true;
                    
                    if (isInline) {
                      return <code className="px-1 py-0.5 rounded bg-muted text-sm" {...props}>{children}</code>;
                    }
                    return (
                      <pre className="p-4 rounded-md bg-muted overflow-x-auto my-4">
                        <code className="text-sm" {...props}>{children}</code>
                      </pre>
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium mb-1">
                Image URL
              </label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <label htmlFor="imageAlt" className="block text-sm font-medium mb-1">
                Alt Text (optional)
              </label>
              <Input
                id="imageAlt"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Description of the image"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInsertImage}>Insert Image</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Table</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label htmlFor="tableRows" className="block text-sm font-medium mb-1">
                Rows (including header)
              </label>
              <Input
                id="tableRows"
                type="number"
                min="2"
                max="20"
                value={tableRows}
                onChange={(e) => setTableRows(parseInt(e.target.value) || 2)}
              />
            </div>
            <div>
              <label htmlFor="tableCols" className="block text-sm font-medium mb-1">
                Columns
              </label>
              <Input
                id="tableCols"
                type="number"
                min="1"
                max="10"
                value={tableCols}
                onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTableDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInsertTable}>Insert Table</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
