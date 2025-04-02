
import React from 'react';
import { NoteEditor } from '@/components/NoteEditor';
import { MarkdownHints, getMarkdownPlaceholder } from '@/components/MarkdownHints';
import { useNotes } from '@/context/NotesContext';

// This is a wrapper around the NoteEditor component that adds markdown hints
// and ensures placeholder content for new notes
export const EnhancedNoteEditor: React.FC = () => {
  const { activeNote, updateNote } = useNotes();
  
  // This effect runs when a note is first created (has empty content)
  React.useEffect(() => {
    if (activeNote && activeNote.content === '') {
      updateNote({
        ...activeNote,
        content: getMarkdownPlaceholder()
      });
    }
  }, [activeNote?.id]);
  
  return (
    <div className="flex flex-col h-full">
      <NoteEditor />
      
      {activeNote && (
        <div className="p-4 border-t">
          <MarkdownHints />
        </div>
      )}
    </div>
  );
};
