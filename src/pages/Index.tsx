
import React from "react";
import { NotesProvider } from "@/context/NotesContext";
import { NotesSidebar } from "@/components/NotesSidebar";
import { EnhancedNoteEditor } from "@/components/EnhancedNoteEditor";
import { SidebarProvider, SidebarTrigger, Sidebar, SidebarContent, SidebarInset } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <NotesProvider>
      <SidebarProvider defaultOpen={!isMobile}>
        <div className="h-screen w-full flex overflow-hidden animate-fade-in">
          <Sidebar>
            <SidebarContent>
              <NotesSidebar />
            </SidebarContent>
          </Sidebar>
          <SidebarInset className="flex flex-col">
            <div className="h-10 flex items-center px-4 border-b lg:hidden">
              <SidebarTrigger />
              <h1 className="text-xl font-serif font-bold ml-2">Reflect</h1>
            </div>
            <EnhancedNoteEditor />
          </SidebarInset>
        </div>
      </SidebarProvider>
    </NotesProvider>
  );
};

export default Index;
