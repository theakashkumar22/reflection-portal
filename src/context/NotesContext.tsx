
import React, { createContext, useContext, useState, useEffect } from "react";
import { Note, Folder } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";

interface NotesContextType {
  notes: Note[];
  folders: Folder[];
  activeNoteId: string | null;
  activeNote: Note | null;
  setActiveNoteId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredNotes: Note[];
  createNote: (folderId: string | null) => void;
  createFolder: (name: string) => void;
  updateNote: (note: Note) => void;
  deleteNote: (id: string) => void;
  deleteFolder: (id: string) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

const defaultNotes: Note[] = [
  {
    id: "welcome-note",
    title: "Welcome to Reflect",
    content: "# Welcome to Reflect\n\nReflect is a clean, powerful note-taking app for your thoughts, ideas, and knowledge.\n\n## Features\n\n- **Markdown Support**: Format your notes with Markdown\n- **Organized Structure**: Keep your notes organized in folders\n- **Clean Interface**: Focus on your content, not the UI\n\n## Getting Started\n\n1. Create a new note using the + button\n2. Organize notes in folders\n3. Use markdown to format your content\n\nEnjoy using Reflect!",
    folderId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultFolders: Folder[] = [
  {
    id: "personal",
    name: "Personal",
    createdAt: new Date().toISOString(),
  },
  {
    id: "work",
    name: "Work",
    createdAt: new Date().toISOString(),
  },
];

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const { toast } = useToast();

  // Initialize state from localStorage or use defaults
  const [notes, setNotes] = useState<Note[]>(() => {
    const savedNotes = localStorage.getItem("notes");
    return savedNotes ? JSON.parse(savedNotes) : defaultNotes;
  });

  const [folders, setFolders] = useState<Folder[]>(() => {
    const savedFolders = localStorage.getItem("folders");
    return savedFolders ? JSON.parse(savedFolders) : defaultFolders;
  });

  const [activeNoteId, setActiveNoteId] = useState<string | null>(() => {
    const savedActiveNoteId = localStorage.getItem("activeNoteId");
    return savedActiveNoteId ? JSON.parse(savedActiveNoteId) : "welcome-note";
  });

  const [searchQuery, setSearchQuery] = useState("");

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem("folders", JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem("activeNoteId", JSON.stringify(activeNoteId));
  }, [activeNoteId]);

  // Find active note
  const activeNote = activeNoteId 
    ? notes.find(note => note.id === activeNoteId) || null 
    : null;

  // Filter notes based on search query
  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create a new note
  const createNote = (folderId: string | null) => {
    const newNote: Note = {
      id: uuidv4(),
      title: "Untitled Note",
      content: "# Untitled Note\n\nStart writing your note here...",
      folderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    toast({
      title: "Note created",
      description: "Your new note has been created.",
    });
  };

  // Create a new folder
  const createFolder = (name: string) => {
    const newFolder: Folder = {
      id: uuidv4(),
      name,
      createdAt: new Date().toISOString(),
    };

    setFolders(prev => [...prev, newFolder]);
    toast({
      title: "Folder created",
      description: `Folder "${name}" has been created.`,
    });
  };

  // Update a note
  const updateNote = (updatedNote: Note) => {
    setNotes(prev => 
      prev.map(note => 
        note.id === updatedNote.id 
          ? { ...updatedNote, updatedAt: new Date().toISOString() } 
          : note
      )
    );
  };

  // Delete a note
  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
    if (activeNoteId === id) {
      setActiveNoteId(notes.length > 1 ? notes[0].id === id ? notes[1].id : notes[0].id : null);
    }
    toast({
      title: "Note deleted",
      description: "Your note has been deleted.",
    });
  };

  // Delete a folder
  const deleteFolder = (id: string) => {
    // Update notes that were in this folder to have null folderId
    setNotes(prev => 
      prev.map(note => 
        note.folderId === id 
          ? { ...note, folderId: null } 
          : note
      )
    );

    // Remove the folder
    setFolders(prev => prev.filter(folder => folder.id !== id));
    toast({
      title: "Folder deleted",
      description: "Your folder has been deleted.",
    });
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        folders,
        activeNoteId,
        activeNote,
        setActiveNoteId,
        searchQuery,
        setSearchQuery,
        filteredNotes,
        createNote,
        createFolder,
        updateNote,
        deleteNote,
        deleteFolder,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
};
