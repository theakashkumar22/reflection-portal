
import React from "react";
import { NotesProvider } from "@/context/NotesContext";
import { NotesSidebar } from "@/components/NotesSidebar";
import { NoteEditor } from "@/components/NoteEditor";

const Index = () => {
  return (
    <NotesProvider>
      <div className="h-screen w-full flex overflow-hidden animate-fade-in">
        <NotesSidebar />
        <NoteEditor />
      </div>
    </NotesProvider>
  );
};

export default Index;
