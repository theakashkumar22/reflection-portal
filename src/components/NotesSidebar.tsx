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
  Trash2,
  MoveHorizontal
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
    moveNote,
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

  const filteredNotes = searchQuery 
    ? notes.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()))
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

  const notesWithoutFolder = filteredNotes.filter(note => note.folderId === null);
  const notesByFolder: Record<string, Note[]> = {};
  
  filteredFolders.forEach(folder => {
    notesByFolder[folder.id] = filteredNotes.filter(note => note.folderId === folder.id);
  });

  if (searchQuery) {
    filteredFolders.forEach(folder => {
      if (notesByFolder[folder.id]?.length > 0 && !expandedFolders[folder.id]) {
        setExpandedFolders(prev => ({ ...prev, [folder.id]: true }));
      }
    });
  }

  return (
    <div className="h-full flex flex-col border-r">
      <div className="p-4">
        <h1 className="text-2xl font-serif font-bold">Reflect</h1>
        <div className="flex items-center mt-4 gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => createNote(null)}
          >
            <PlusCircle className="h-5 w-5" />
          </Button>
          
          <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Folder className="h-5 w-5" />
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
        {notesWithoutFolder.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground px-4 py-2">NOTES</h3>
            {notesWithoutFolder.map(note => (
              <NoteItem
                key={note.id}
                note={note}
                isActive={note.id === activeNoteId}
                onClick={() => handleNoteClick(note.id)}
                folders={folders}
                onMoveNote={moveNote}
              />
            ))}
          </div>
        )}
        
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
                folders={folders}
                onMoveNote={moveNote}
              />
            ))}
          </div>
        )}

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
  folders: FolderType[];
  onMoveNote: (noteId: string, targetFolderId: string | null) => void;
}

const NoteItem: React.FC<NoteItemProps> = ({ note, isActive, onClick, folders, onMoveNote }) => {
  return (
    <div
      className={cn(
        "flex items-center px-4 py-1.5 text-sm cursor-pointer hover:bg-accent group relative",
        isActive && "bg-primary/10 text-primary font-medium"
      )}
      onClick={onClick}
    >
      <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
      <span className="truncate flex-1">{note.title}</span>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <MoveHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem 
            disabled={note.folderId === null}
            onClick={(e) => {
              e.stopPropagation();
              onMoveNote(note.id, null);
            }}
          >
            Move to No Folder
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <div className="max-h-[150px] overflow-y-auto pr-2">
            {folders.map(folder => (
              <DropdownMenuItem
                key={folder.id}
                disabled={note.folderId === folder.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveNote(note.id, folder.id);
                }}
              >
                Move to {folder.name}
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
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
  folders: FolderType[];
  onMoveNote: (noteId: string, targetFolderId: string | null) => void;
}

const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  notes,
  isExpanded,
  onToggle,
  activeNoteId,
  onNoteClick,
  onCreateNote,
  onDeleteFolder,
  folders,
  onMoveNote
}) => {
  return (
    <div>
      <div 
        className="flex items-center px-4 py-1.5 text-sm cursor-pointer hover:bg-accent group relative"
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
        <span className="font-medium flex-1 truncate">{folder.name}</span>
        
        <div className="flex items-center ml-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-transparent"
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
                className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-transparent text-red-500 hover:text-red-600"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Folder</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this folder? Notes inside will be moved to "Notes" section.
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
              folders={folders}
              onMoveNote={onMoveNote}
            />
          ))}
        </div>
      )}
    </div>
  );
};
