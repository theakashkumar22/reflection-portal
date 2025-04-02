
import React, { useState } from 'react';
import { NoteEditor } from '@/components/NoteEditor';
import { MarkdownHints, getMarkdownPlaceholder } from '@/components/MarkdownHints';
import { useNotes } from '@/context/NotesContext';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Bold, Italic, List, ListOrdered, Quote, Code, Heading1, Heading2 } from "lucide-react";

// This is a wrapper around the NoteEditor component that adds markdown hints
// and ensures placeholder content for new notes
export const EnhancedNoteEditor: React.FC = () => {
  const { activeNote, updateNote } = useNotes();
  const [showTips, setShowTips] = useState(true);
  
  // This effect runs when a note is first created (has empty content)
  React.useEffect(() => {
    if (activeNote && activeNote.content === '') {
      updateNote({
        ...activeNote,
        content: getMarkdownPlaceholder()
      });
    }
  }, [activeNote?.id]);

  const handleInsertMarkdown = (markdown: string) => {
    if (!activeNote) return;
    
    // Get the current content and append the markdown
    const updatedContent = activeNote.content + '\n' + markdown;
    updateNote({
      ...activeNote,
      content: updatedContent
    });
  };
  
  return (
    <div className="flex flex-col h-full">
      {activeNote && (
        <div className="p-2 border-b bg-muted/30">
          <ToggleGroup type="multiple" size="sm">
            <ToggleGroupItem value="bold" aria-label="Toggle bold" onClick={() => handleInsertMarkdown('**Bold text**')}>
              <Bold className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Toggle italic" onClick={() => handleInsertMarkdown('*Italic text*')}>
              <Italic className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="h1" aria-label="Heading 1" onClick={() => handleInsertMarkdown('# Heading 1')}>
              <Heading1 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="h2" aria-label="Heading 2" onClick={() => handleInsertMarkdown('## Heading 2')}>
              <Heading2 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Bulleted list" onClick={() => handleInsertMarkdown('- List item')}>
              <List className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="ordered-list" aria-label="Numbered list" onClick={() => handleInsertMarkdown('1. Numbered item')}>
              <ListOrdered className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="quote" aria-label="Quote" onClick={() => handleInsertMarkdown('> Blockquote')}>
              <Quote className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="code" aria-label="Code block" onClick={() => handleInsertMarkdown('```\ncode block\n```')}>
              <Code className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}
      
      <NoteEditor />
      
      {activeNote && (
        <div className="p-4 border-t">
          <MarkdownHints />
        </div>
      )}
    </div>
  );
};
