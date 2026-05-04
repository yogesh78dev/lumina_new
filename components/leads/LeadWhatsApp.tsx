import React, { useState, useEffect, useRef } from 'react';
import { useCrm } from '../../hooks/useCrm';
import { Lead, WhatsAppMessage } from '../../types';

const LeadWhatsApp: React.FC<{ lead: Lead }> = ({ lead }) => {
    const { getWhatsAppMessagesForLead, sendWhatsAppMessage } = useCrm();
    const [newMessage, setNewMessage] = useState('');
    const messages = getWhatsAppMessagesForLead(lead.id);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            sendWhatsAppMessage(lead.id, newMessage.trim());
            setNewMessage('');
        }
    };

    return (
        <div className="border rounded-lg overflow-hidden bg-[#E5DDD5] min-h-[400px] flex flex-col">
            <div className="flex-grow p-4 space-y-3 overflow-y-auto thin-scrollbar" style={{ backgroundImage: 'url(https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png)' }}>
                {messages.map(msg => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.type === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-3 py-2 rounded-lg shadow ${msg.type === 'outgoing' ? 'bg-[#DCF8C6]' : 'bg-white'}`}>
                            <p className="text-sm text-gray-800 break-words">{msg.content}</p>
                            <p className="text-xs mt-1 text-right text-gray-400">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}
                 <div ref={messagesEndRef} />
            </div>
            <div className="p-2 bg-gray-100 flex-shrink-0">
                <form onSubmit={handleSend} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message"
                        className="flex-grow w-full rounded-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2"
                        autoComplete="off"
                    />
                    <button type="submit" className="w-11 h-11 bg-primary text-white rounded-full flex-shrink-0 flex items-center justify-center hover:bg-primary/90">
                        <i className="ri-send-plane-fill text-xl"></i>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LeadWhatsApp;