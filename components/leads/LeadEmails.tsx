import React, { useState } from 'react';
import { useCrm } from '../../hooks/useCrm';
import { Lead, Email } from '../../types';

const EmailComposerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    lead: Lead;
}> = ({ isOpen, onClose, lead }) => {
    const { sendEmail, currentUser } = useCrm();
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (subject && body && lead.email && currentUser) {
            sendEmail({
                leadId: lead.id,
                to: lead.email,
                from: currentUser.email,
                subject,
                body,
            });
            onClose();
            setSubject('');
            setBody('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-4 border-b">
                        <h3 className="text-lg font-semibold">Compose Email</h3>
                    </div>
                    <div className="p-4 space-y-4">
                        <div>
                            <label className="text-sm font-medium">To:</label>
                            <input type="text" readOnly value={`${lead.name} <${lead.email}>`} className="w-full mt-1 p-2 bg-gray-100 border rounded-md" />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Subject:</label>
                            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full mt-1 p-2 border rounded-md" required/>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Body:</label>
                            <textarea value={body} onChange={e => setBody(e.target.value)} rows={8} className="w-full mt-1 p-2 border rounded-md" required/>
                        </div>
                    </div>
                    <div className="flex justify-end p-4 bg-gray-50 border-t space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md text-sm">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md text-sm">Send</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const LeadEmails: React.FC<{ lead: Lead }> = ({ lead }) => {
    const { getEmailsForLead, currentUser } = useCrm();
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const emails = getEmailsForLead(lead.id);

    return (
        <div>
             <button onClick={() => setIsComposerOpen(true)} className="w-full mb-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 text-sm font-medium flex items-center justify-center">
                <i className="ri-add-line mr-2"></i>Compose Email
            </button>
            <div className="border rounded-lg overflow-hidden">
                <div className="flex min-h-[400px]">
                    <div className="w-1/3 border-r overflow-y-auto">
                        {emails.length > 0 ? emails.map(email => (
                            <button key={email.id} onClick={() => setSelectedEmail(email)} className={`w-full text-left p-3 border-b ${selectedEmail?.id === email.id ? 'bg-primary/10' : 'hover:bg-gray-50'}`}>
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <span className="font-semibold">{email.type === 'incoming' ? lead.name : 'Me'}</span>
                                    <span>{new Date(email.timestamp).toLocaleDateString()}</span>
                                </div>
                                <p className={`text-sm font-semibold truncate ${!email.isRead && email.type === 'incoming' ? 'text-primary' : 'text-gray-800'}`}>{email.subject}</p>
                                <p className="text-xs text-gray-600 truncate">{email.body}</p>
                            </button>
                        )) : (
                             <p className="p-4 text-sm text-gray-500">No emails yet.</p>
                        )}
                    </div>
                    <div className="w-2/3 overflow-y-auto p-4">
                        {selectedEmail ? (
                            <div>
                                <h3 className="text-lg font-bold">{selectedEmail.subject}</h3>
                                <div className="text-sm mt-2 border-b pb-2">
                                    <p><strong>From:</strong> {selectedEmail.from}</p>
                                    <p><strong>To:</strong> {selectedEmail.to}</p>
                                    <p className="text-gray-500 text-xs mt-1">{new Date(selectedEmail.timestamp).toLocaleString()}</p>
                                </div>
                                <div className="prose prose-sm mt-4 whitespace-pre-wrap">{selectedEmail.body}</div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">Select an email to view</div>
                        )}
                    </div>
                </div>
            </div>
             <EmailComposerModal isOpen={isComposerOpen} onClose={() => setIsComposerOpen(false)} lead={lead} />
        </div>
    );
};

export default LeadEmails;