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
  Table
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
  const { activeNote, updateNote, deleteNote } = useNotes();
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

  const exportToPdf = () => {
    if (!activeNote || !previewRef.current) return;

    // Clone the preview content to manipulate it before PDF generation
    const clonedPreview = previewRef.current.cloneNode(true) as HTMLElement;
    
    // Style fixes for PDF export
    const images = clonedPreview.querySelectorAll('img');
    images.forEach(img => {
      // Set max width for images in PDF
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.margin = '10px 0';
    });

    // Style tables for PDF
    const tables = clonedPreview.querySelectorAll('table');
    tables.forEach(table => {
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.marginBottom = '16px';
      
      const cells = table.querySelectorAll('th, td');
      cells.forEach(cell => {
        cell.setAttribute('style', 'border: 1px solid #ddd; padding: 8px; text-align: left;');
      });
      
      const headers = table.querySelectorAll('th');
      headers.forEach(header => {
        header.style.backgroundColor = '#f2f2f2';
        header.style.fontWeight = 'bold';
      });
    });

    // Style lists for PDF
    const lists = clonedPreview.querySelectorAll('ul, ol');
    lists.forEach(list => {
      list.style.paddingLeft = '20px';
      list.style.marginBottom = '16px';
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
            <div 
              ref={previewRef} 
              className="p-6 prose prose-sm sm:prose-base lg:prose-lg max-w-full note-editor"
            >
              <style>{`
                .note-editor { 
                  white-space: pre-wrap; 
                  word-wrap: break-word; 
                }
                .note-editor img {
                  max-width: 100%;
                  height: auto;
                  margin: 1em 0;
                  display: block;
                }
                .note-editor p {
                  margin-bottom: 1em;
                }
                .note-editor h1, .note-editor h2, .note-editor h3 {
                  margin-top: 1.5em;
                  margin-bottom: 0.5em;
                }
                .note-editor ul, .note-editor ol {
                  padding-left: 1.5em;
                  margin-bottom: 1em;
                }
                .note-editor li {
                  margin-bottom: 0.5em;
                }
                .note-editor blockquote {
                  border-left: 4px solid #e2e8f0;
                  padding-left: 1em;
                  font-style: italic;
                  margin: 1em 0;
                }
                .note-editor pre {
                  background-color: #f1f5f9;
                  border-radius: 0.375rem;
                  padding: 1em;
                  overflow-x: auto;
                  margin: 1em 0;
                }
                .note-editor code {
                  font-family: monospace;
                  padding: 0.2em 0.4em;
                  background-color: #f1f5f9;
                  border-radius: 0.25rem;
                }
                .note-editor table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 1em 0;
                }
                .note-editor th, .note-editor td {
                  border: 1px solid #e2e8f0;
                  padding: 0.5em;
                  text-align: left;
                }
                .note-editor th {
                  background-color: #f8fafc;
                  font-weight: bold;
                }
                .note-editor tr:nth-child(even) {
                  background-color: #f8fafc;
                }
              `}</style>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => {
                    const trimmedChildren = React.Children.map(children, child => 
                      typeof child === 'string' ? child.trim() : child
                    );
                    return <p>{trimmedChildren}</p>;
                  },
                  img: ({ src, alt, ...props }) => {
                    return (
                      <img 
                        src={src} 
                        alt={alt || ''} 
                        className="max-w-full h-auto rounded-md my-4"
                        {...props}
                      />
                    );
                  },
                  table: ({ children }) => {
                    return (
                      <div className="overflow-x-auto my-4">
                        <table className="w-full border-collapse">{children}</table>
                      </div>
                    );
                  },
                  th: ({ children }) => {
                    return (
                      <th className="border border-slate-300 bg-slate-100 dark:bg-slate-800 px-4 py-2 text-left font-medium">
                        {children}
                      </th>
                    );
                  },
                  td: ({ children }) => {
                    return (
                      <td className="border border-slate-300 px-4 py-2">
                        {children}
                      </td>
                    );
                  },
                  pre: ({ children }) => {
                    return (
                      <pre className="bg-slate-100 dark:bg-slate-800 rounded-md p-4 overflow-x-auto my-4">
                        {children}
                      </pre>
                    );
                  },
                  code: ({ node, children }) => {
                    const isInline = node.type === 'element' && node.tagName !== 'pre';
                    return isInline ? (
                      <code className="bg-slate-100 dark:bg-slate-800 rounded px-1 py-0.5 font-mono text-sm">
                        {children}
                      </code>
                    ) : (
                      <code className="font-mono text-sm">{children}</code>
                    );
                  },
                  blockquote: ({ children }) => {
                    return (
                      <blockquote className="border-l-4 border-slate-300 pl-4 italic my-4">
                        {children}
                      </blockquote>
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

      {/* Image Dialog */}
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

      {/* Table Dialog */}
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
