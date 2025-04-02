
import React, { useState, useEffect } from "react";
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
import { Edit, Eye, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export const NoteEditor: React.FC = () => {
  const { activeNote, updateNote, deleteNote } = useNotes();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [activeTab, setActiveTab] = useState<string>("edit");

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
    <div className="flex-1 flex flex-col w-full h-full">
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
        className="flex-1 flex flex-col h-full"
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

        <TabsContent value="edit" className="flex-1 m-0 p-0 h-full overflow-hidden">
          <div className="h-full w-full">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your note..."
              className={cn(
                "flex-1 h-full w-full resize-none rounded-none border-none focus-visible:ring-0 p-4",
                "font-mono text-sm"
              )}
            />
          </div>
        </TabsContent>

        <TabsContent value="preview" className="flex-1 m-0 p-0 h-full overflow-hidden">
          <ScrollArea className="h-full w-full">
            <div className="p-6 prose prose-sm sm:prose-base lg:prose-lg max-w-full note-editor">
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
