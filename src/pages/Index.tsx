
import React, { useState } from "react";
import { NotesProvider } from "@/context/NotesContext";
import { NotesSidebar } from "@/components/NotesSidebar";
import { NoteEditor } from "@/components/NoteEditor";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent,
  SidebarTrigger 
} from "@/components/ui/sidebar";
import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  return (
    <NotesProvider>
      <SidebarProvider defaultOpen={!isMobile} open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <div className="h-screen w-full flex overflow-hidden animate-fade-in">
          <Sidebar collapsible="offcanvas">
            <SidebarContent>
              <NotesSidebar onNoteSelect={() => isMobile && setSidebarOpen(false)} />
            </SidebarContent>
          </Sidebar>
          
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="p-2 border-b flex items-center shrink-0">
              <SidebarTrigger />
              <h1 className="text-lg font-serif font-medium ml-2">Reflect</h1>
            </div>
            
            <div className="flex-1 h-full overflow-hidden">
              <NoteEditor />
            </div>
          </div>
        </div>
      </SidebarProvider>
    </NotesProvider>
  );
};

export default Index;
