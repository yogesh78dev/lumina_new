
import React, { useState, useMemo } from 'react';
import { useCrm } from '../../hooks/useCrm';
import { Lead, LeadNote, LeadReminder } from '../../types';
import { useSwal } from '../../hooks/useSwal';
import Tooltip from '../common/Tooltip';

type ActivityItem = {
    type: 'note' | 'reminder';
    date: Date;
    data: LeadNote | LeadReminder;
}

const LeadActivityTab: React.FC<{ lead: Lead }> = ({ lead }) => {
    const { getNotesForLead, addNoteForLead, updateNote, deleteNote, getRemindersForLead, addReminderForLead, updateReminder, deleteReminder, toggleReminderCompletion } = useCrm();
    const { confirmDelete, fireToast } = useSwal();
    const [inputType, setInputType] = useState<'note' | 'task'>('note');
    
    // Form states for new entry
    const [content, setContent] = useState('');
    const [dueDate, setDueDate] = useState('');

    // Editing states
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [editDate, setEditDate] = useState('');

    // FIX: Cast lead.id to string
    const notes = getNotesForLead(String(lead.id));
    const reminders = getRemindersForLead(String(lead.id));

    const activities = useMemo(() => {
        const combined: ActivityItem[] = [
            ...notes.map(n => ({ type: 'note' as const, date: new Date(n.createdAt), data: n })),
            ...reminders.map(r => ({ type: 'reminder' as const, date: new Date(r.dueDate), data: r })),
        ];
        return combined.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [notes, reminders]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        if (inputType === 'note') {
            // FIX: Cast lead.id to string
            addNoteForLead(String(lead.id), content.trim());
        } else {
            if (!dueDate) {
                alert('Please select a due date for the task');
                return;
            }
            // FIX: Cast lead.id to string
            addReminderForLead(String(lead.id), content.trim(), new Date(dueDate).toISOString());
            setDueDate('');
        }
        setContent('');
    };

    // --- Actions Handlers ---

    const handleEditClick = (activity: ActivityItem) => {
        // FIX: Cast activity.data.id to string to match SetStateAction<string | null>
        setEditingId(String(activity.data.id));
        if (activity.type === 'note') {
            setEditContent((activity.data as LeadNote).content);
        } else {
            setEditContent((activity.data as LeadReminder).note);
            // Format date for datetime-local input
            const d = new Date((activity.data as LeadReminder).dueDate);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            setEditDate(d.toISOString().slice(0, 16));
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditContent('');
        setEditDate('');
    };

    const handleSaveEdit = (activity: ActivityItem) => {
        if (!editContent.trim()) return;

        if (activity.type === 'note') {
            updateNote(activity.data.id, editContent);
            fireToast('success', 'Note updated successfully');
        } else {
            if (!editDate) {
                fireToast('error', 'Please select a due date');
                return;
            }
            updateReminder(activity.data.id, editContent, new Date(editDate).toISOString());
            fireToast('success', 'Task updated successfully');
        }
        handleCancelEdit();
    };

    const handleDeleteClick = async (activity: ActivityItem) => {
        const result = await confirmDelete({
            title: `Delete ${activity.type === 'note' ? 'Note' : 'Task'}?`,
            html: `Are you sure you want to delete this ${activity.type}? This action cannot be undone.`
        });

        if (result) {
            if (activity.type === 'note') {
                // FIX: Passed lead.id as first argument to match context signature deleteNote(id, noteId)
                deleteNote(lead.id, activity.data.id);
            } else {
                // FIX: Passed lead.id as first argument to match context signature deleteReminder(id, reminderId)
                deleteReminder(lead.id, activity.data.id);
            }
            fireToast('success', 'Item deleted');
        }
    };
    
    return (
        <div className="flex flex-col h-full">
            {/* New Activity Input Area */}
            <div className="mb-8">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-1 shadow-sm">
                    <div className="flex gap-2 p-2 border-b border-gray-200/60 mb-2">
                        <button 
                            onClick={() => setInputType('note')} 
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${inputType === 'note' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <i className="ri-sticky-note-line"></i> Note
                        </button>
                        <button 
                            onClick={() => setInputType('task')} 
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${inputType === 'task' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <i className="ri-task-line"></i> Task
                        </button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="px-2 pb-2">
                        <textarea 
                            value={content} 
                            onChange={e => setContent(e.target.value)} 
                            placeholder={inputType === 'note' ? "Write a note about this lead..." : "What needs to be done?"}
                            rows={3} 
                            className="w-full bg-transparent border-0 focus:ring-0 text-sm text-gray-800 placeholder-gray-400 resize-none p-2"
                        />
                        
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200/60">
                            <div className="flex items-center gap-2">
                                {inputType === 'task' && (
                                    <input 
                                        type="datetime-local" 
                                        value={dueDate} 
                                        onChange={e => setDueDate(e.target.value)} 
                                        className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-600 focus:outline-none focus:border-primary"
                                    />
                                )}
                            </div>
                            <button 
                                type="submit" 
                                disabled={!content.trim()}
                                className="bg-gray-900 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {inputType === 'note' ? 'Add Note' : 'Create Task'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Timeline */}
            <div className="flex-grow">
                <h4 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <i className="ri-history-line"></i> Activity Timeline
                </h4>
                
                <div className="relative border-l-2 border-gray-100 ml-3.5 space-y-8 pb-4">
                    {activities.length > 0 ? activities.map(activity => (
                        <div key={activity.data.id} className="relative pl-8 group">
                            {/* Dot on Timeline */}
                            <div className={`absolute -left-[9px] top-0 h-5 w-5 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${
                                activity.type === 'note' ? 'bg-blue-500' : 'bg-orange-500'
                            }`}>
                            </div>
                            
                            {/* Card Content */}
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                                <div className="flex-1 w-full">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                                activity.type === 'note' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                                            }`}>
                                                {activity.type === 'note' ? 'NOTE' : 'TASK'}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {activity.date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        
                                        {/* Actions (Edit/Delete) - Only show if not editing */}
                                        {editingId !== String(activity.data.id) && (
                                            <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Tooltip content="Edit">
                                                    <button onClick={() => handleEditClick(activity)} className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                                                        <i className="ri-pencil-line text-lg"></i>
                                                    </button>
                                                </Tooltip>
                                                <Tooltip content="Delete">
                                                    <button onClick={() => handleDeleteClick(activity)} className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                                                        <i className="ri-delete-bin-line text-lg"></i>
                                                    </button>
                                                </Tooltip>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-gray-200 transition-colors">
                                        
                                        {/* Editing Mode */}
                                        {editingId === String(activity.data.id) ? (
                                            <div className="space-y-3">
                                                <textarea
                                                    value={editContent}
                                                    onChange={e => setEditContent(e.target.value)}
                                                    className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-1 focus:ring-primary focus:border-primary"
                                                    rows={3}
                                                />
                                                {activity.type === 'reminder' && (
                                                    <input
                                                        type="datetime-local"
                                                        value={editDate}
                                                        onChange={e => setEditDate(e.target.value)}
                                                        className="w-full text-xs border border-gray-300 rounded p-2"
                                                    />
                                                )}
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={handleCancelEdit} className="text-xs px-3 py-1.5 bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50">Cancel</button>
                                                    <button onClick={() => handleSaveEdit(activity)} className="text-xs px-3 py-1.5 bg-primary text-white rounded hover:bg-primary/90">Save</button>
                                                </div>
                                            </div>
                                        ) : (
                                            // Display Mode
                                            activity.type === 'note' ? (
                                                <>
                                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{(activity.data as LeadNote).content}</p>
                                                    <div className="mt-2 text-xs text-gray-400 font-medium">
                                                        Added by {(activity.data as LeadNote).author}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex items-start gap-3">
                                                    <div className="pt-0.5">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={(activity.data as LeadReminder).isCompleted} 
                                                            onChange={() => toggleReminderCompletion(activity.data.id)} 
                                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" 
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className={`text-sm font-medium ${(activity.data as LeadReminder).isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                                            {(activity.data as LeadReminder).note}
                                                        </p>
                                                        <p className={`text-xs mt-1 font-medium ${
                                                            new Date((activity.data as LeadReminder).dueDate) < new Date() && !(activity.data as LeadReminder).isCompleted 
                                                            ? 'text-red-600' 
                                                            : 'text-gray-500'
                                                        }`}>
                                                            <i className="ri-calendar-event-line mr-1"></i>
                                                            Due: {new Date((activity.data as LeadReminder).dueDate).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="ml-4 py-8 flex flex-col items-center justify-center text-center text-gray-400">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                <i className="ri-chat-history-line text-2xl"></i>
                            </div>
                            <p className="text-sm">No activity recorded yet.</p>
                            <p className="text-xs">Add a note or task to get started.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeadActivityTab;
