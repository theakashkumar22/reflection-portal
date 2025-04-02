import React, { useState } from "react";
import { useNotes } from "@/context/NotesContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Folder, 
  FolderOpen, 
  PlusCircle, 
  Search, 
  X,
  Trash2
} from "lucide-react";
import { Folder as FolderType, Note } from "@/types";
import { cn } from "@/lib/utils";
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

interface NotesSidebarProps {
  onNoteSelect?: () => void;
}

export const NotesSidebar: React.FC<NotesSidebarProps> = ({ onNoteSelect }) => {
  const { 
    notes, 
    folders, 
    activeNoteId, 
    setActiveNoteId, 
    createNote, 
    createFolder,
    deleteFolder,
    searchQuery,
    setSearchQuery 
  } = useNotes();
  
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>(
    folders.reduce((acc, folder) => ({ ...acc, [folder.id]: true }), {})
  );
  
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);

  const handleFolderToggle = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName("");
      setIsCreateFolderOpen(false);
    }
  };

  const handleNoteClick = (noteId: string) => {
    setActiveNoteId(noteId);
    if (onNoteSelect) {
      onNoteSelect();
    }
  };

  // Filter notes and folders based on search query
  const filteredNotes = searchQuery 
    ? notes.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    : notes;

  const filteredFolders = searchQuery
    ? folders.filter(folder => 
        folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notes.some(note => 
          note.folderId === folder.id && 
          (note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           note.content.toLowerCase().includes(searchQuery.toLowerCase()))
        ))
    : folders;

  // Group notes by folders
  const notesWithoutFolder = filteredNotes.filter(note => note.folderId === null);
  const notesByFolder: Record<string, Note[]> = {};
  
  filteredFolders.forEach(folder => {
    notesByFolder[folder.id] = filteredNotes.filter(note => note.folderId === folder.id);
  });

  // Auto-expand folders that contain search results
  if (searchQuery) {
    filteredFolders.forEach(folder => {
      if (notesByFolder[folder.id]?.length > 0 && !expandedFolders[folder.id]) {
        setExpandedFolders(prev => ({ ...prev, [folder.id]: true }));
      }
    });
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4">
        <h1 className="text-2xl font-serif font-bold text-sidebar-foreground">Reflect</h1>
        <div className="flex items-center mt-4 gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => createNote(null)}
          >
            <PlusCircle className="h-5 w-5 text-sidebar-foreground" />
          </Button>
          
          <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Folder className="h-5 w-5 text-sidebar-foreground" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-2">
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                />
                <Button onClick={handleCreateFolder}>Create</Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="pl-8 h-8 text-sm"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-5 w-5"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <Separator />
      
      <ScrollArea className="flex-1 py-2">
        {/* Render notes without folders */}
        {notesWithoutFolder.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground px-4 py-2">NOTES</h3>
            {notesWithoutFolder.map(note => (
              <NoteItem
                key={note.id}
                note={note}
                isActive={note.id === activeNoteId}
                onClick={() => handleNoteClick(note.id)}
              />
            ))}
          </div>
        )}
        
        {/* Render folders and their notes */}
        {filteredFolders.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground px-4 py-2">FOLDERS</h3>
            {filteredFolders.map(folder => (
              <FolderItem
                key={folder.id}
                folder={folder}
                notes={notesByFolder[folder.id] || []}
                isExpanded={expandedFolders[folder.id]}
                onToggle={() => handleFolderToggle(folder.id)}
                activeNoteId={activeNoteId}
                onNoteClick={handleNoteClick}
                onCreateNote={() => createNote(folder.id)}
                onDeleteFolder={() => deleteFolder(folder.id)}
              />
            ))}
          </div>
        )}

        {/* Show message when no results found */}
        {searchQuery && filteredNotes.length === 0 && filteredFolders.length === 0 && (
          <div className="p-4 text-center text-muted-foreground">
            No notes or folders found matching "{searchQuery}"
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

interface NoteItemProps {
  note: Note;
  isActive: boolean;
  onClick: () => void;
}

const NoteItem: React.FC<NoteItemProps> = ({ note, isActive, onClick }) => {
  return (
    <div
      className={cn(
        "flex items-center px-4 py-1.5 text-sm cursor-pointer hover:bg-sidebar-accent group",
        isActive && "bg-sidebar-primary/10 text-sidebar-primary font-medium"
      )}
      onClick={onClick}
    >
      <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
      <span className="truncate">{note.title}</span>
    </div>
  );
};

interface FolderItemProps {
  folder: FolderType;
  notes: Note[];
  isExpanded: boolean;
  onToggle: () => void;
  activeNoteId: string | null;
  onNoteClick: (id: string) => void;
  onCreateNote: () => void;
  onDeleteFolder: () => void;
}

const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  notes,
  isExpanded,
  onToggle,
  activeNoteId,
  onNoteClick,
  onCreateNote,
  onDeleteFolder
}) => {
  return (
    <div>
      <div 
        className="flex items-center px-4 py-1.5 text-sm cursor-pointer hover:bg-sidebar-accent group"
        onClick={onToggle}
      >
        <div className="mr-1 text-muted-foreground">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
        {isExpanded ? (
          <FolderOpen className="h-4 w-4 mr-2 text-muted-foreground" />
        ) : (
          <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
        )}
        <span className="font-medium">{folder.name}</span>
        
        <div className="ml-auto flex">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onCreateNote();
            }}
          >
            <PlusCircle className="h-3 w-3" />
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Folder</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this folder and all its contents?
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFolder();
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      {isExpanded && notes.length > 0 && (
        <div className="ml-6">
          {notes.map(note => (
            <NoteItem
              key={note.id}
              note={note}
              isActive={note.id === activeNoteId}
              onClick={() => onNoteClick(note.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};