import React, { useState } from 'react';
import { useCrm } from '../../hooks/useCrm';

interface LeadNotesProps {
  leadId: string;
}

const LeadNotes: React.FC<LeadNotesProps> = ({ leadId }) => {
  const { getNotesForLead, addNoteForLead } = useCrm();
  const [newNote, setNewNote] = useState('');
  const notes = getNotesForLead(leadId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim()) {
      addNoteForLead(leadId, newNote.trim());
      setNewNote('');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-4">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a new note..."
          rows={3}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
        ></textarea>
        <button type="submit" className="mt-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 text-sm font-medium w-full">
          Add Note
        </button>
      </form>
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {notes.length > 0 ? notes.map(note => (
          <div key={note.id} className="bg-gray-50 p-3 rounded-md">
            <p className="text-gray-800 text-sm">{note.content}</p>
            <div className="text-xs text-gray-400 mt-2 text-right">
              {note.author} - {new Date(note.createdAt).toLocaleString()}
            </div>
          </div>
        )) : (
            <p className="text-gray-500 text-sm text-center py-4">No notes for this lead yet.</p>
        )}
      </div>
    </div>
  );
};

export default LeadNotes;