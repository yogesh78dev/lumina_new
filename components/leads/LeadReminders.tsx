
import React, { useState } from 'react';
import { useCrm } from '../../hooks/useCrm';

interface LeadRemindersProps {
    leadId: string;
}

const LeadReminders: React.FC<LeadRemindersProps> = ({ leadId }) => {
    const { getRemindersForLead, addReminderForLead, toggleReminderCompletion } = useCrm();
    const [note, setNote] = useState('');
    const [dueDate, setDueDate] = useState('');

    const reminders = getRemindersForLead(leadId);
    const upcoming = reminders.filter(r => !r.isCompleted);
    const completed = reminders.filter(r => r.isCompleted);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (note.trim() && dueDate) {
            addReminderForLead(leadId, note, new Date(dueDate).toISOString());
            setNote('');
            setDueDate('');
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit} className="mb-4 space-y-2">
                 <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Task or reminder note..."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
                />
                <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2"
                />
                <button type="submit" className="w-full mt-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 text-sm font-medium">
                    Set Task
                </button>
            </form>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                <h4 className="text-sm font-semibold text-gray-600 mt-4">Upcoming</h4>
                {upcoming.length > 0 ? upcoming.map(r => (
                    <div key={r.id} className="flex items-start text-sm">
                        {/* FIX line 51: cast r.id to string */}
                        <input type="checkbox" checked={r.isCompleted} onChange={() => toggleReminderCompletion(String(r.id))} className="mt-1 mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        <div>
                            <p className="text-gray-800">{r.note}</p>
                            <p className="text-xs text-primary">{new Date(r.dueDate).toLocaleString()}</p>
                        </div>
                    </div>
                )) : <p className="text-xs text-gray-500 pl-6">None</p>}
                
                <h4 className="text-sm font-semibold text-gray-600 mt-4 pt-2 border-t">Completed</h4>
                {completed.length > 0 ? completed.map(r => (
                     <div key={r.id} className="flex items-start text-sm opacity-60">
                        {/* FIX line 62: cast r.id to string */}
                        <input type="checkbox" checked={r.isCompleted} onChange={() => toggleReminderCompletion(String(r.id))} className="mt-1 mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        <div>
                            <p className="text-gray-800 line-through">{r.note}</p>
                            <p className="text-xs text-gray-500">{new Date(r.dueDate).toLocaleString()}</p>
                        </div>
                    </div>
                )) : <p className="text-xs text-gray-500 pl-6">None</p>}
                 {reminders.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No reminders for this lead.</p>}
            </div>
        </div>
    );
};

export default LeadReminders;
