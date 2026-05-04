
import React, { useState, useEffect, useRef } from 'react';
import { useCrm } from '../../hooks/useCrm';
import { User, ChatMessage } from '../../types';
import { generateAvatar } from '../../utils/avatar';
import { capitalizeName } from '../../utils/formatters';
import Tooltip from '../common/Tooltip';

interface ConversationProps {
    contact: User;
}

const suggestedReplies = [
    "Okay, thanks! 👍",
    "Please send the details.",
    "I'll call you shortly.",
    "Approved. ✅",
    "Can we reschedule?",
    "Documents received.",
];

const COMMON_EMOJIS = [
    '👍', '👎', '❤️', '🔥', '🎉', '😊', '😂', '😮', '😢', '😡', 
    '✅', '❌', '📅', '📞', '📎', '💼', '✈️', '🌍', '👋', '🙏'
];

const Conversation: React.FC<ConversationProps> = ({ contact }) => {
    const { getMessagesWithUser, sendMessage, currentUser, markMessagesAsRead } = useCrm();
    const [newMessage, setNewMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    
    // Messages are now reactively derived from the context
    const messages = getMessagesWithUser(String(contact.id));
    const isOnline = String(contact.id).charCodeAt(0) % 2 === 0;

    // Scroll to bottom when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Mark as read when messages arrive while conversation is open
    useEffect(() => {
        const hasUnread = messages.some(m => !m.isRead && String(m.senderId) === String(contact.id));
        if (hasUnread) {
            markMessagesAsRead(String(contact.id));
        }
    }, [messages, contact.id, markMessagesAsRead]);

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = newMessage.trim();
        if (trimmed) {
            try {
                await sendMessage(String(contact.id), trimmed);
                setNewMessage('');
                setShowEmojiPicker(false);
            } catch (error) {
                // Error handled in context or could add local toast here
            }
        }
    };

    const handleEmojiClick = (emoji: string) => {
        setNewMessage(prev => prev + emoji);
    };

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            await sendMessage(String(contact.id), `📎 Shared a file: ${file.name}`);
            e.target.value = '';
        }
    };

    const handleSuggestedReply = (reply: string) => {
        setNewMessage(reply);
    };

    if (!currentUser) return null;

    const avatarSrc = contact.imageUrl || generateAvatar(contact.name);

    return (
        <div className="h-full flex flex-col bg-[#eef2f6] relative">
            {/* Header */}
            <div className="flex-shrink-0 bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <img src={avatarSrc} alt={contact.name} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                        {isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-sm leading-tight">{capitalizeName(contact.name)}</h3>
                        <p className="text-xs text-gray-500 flex items-center">
                            {isOnline ? <span className="text-green-600 font-medium">Active Now</span> : 'Offline'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-1 text-primary">
                    <Tooltip content="More Info" position="left">
                        <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors">
                            <i className="ri-information-line text-xl"></i>
                        </button>
                    </Tooltip>
                </div>
            </div>

            {/* Chat Body */}
            <div className="flex-grow p-4 space-y-2 overflow-y-auto thin-scrollbar bg-chat-pattern">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2 opacity-60">
                        <i className="ri-chat-smile-2-line text-5xl"></i>
                        <p className="text-sm">Say hello to {contact.name.split(' ')[0]}!</p>
                    </div>
                )}

                {messages.map((msg, index) => {
                    const isSentByMe = String(msg.senderId) === String(currentUser.id);
                    const showAvatar = !isSentByMe && (index === 0 || messages[index-1].senderId !== msg.senderId);
                    
                    return (
                        <div key={msg.id} className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'} group mb-1`}>
                            {!isSentByMe && (
                                <div className="w-8 flex-shrink-0 mr-2 flex items-end">
                                    {showAvatar ? (
                                        <img src={avatarSrc} className="w-6 h-6 rounded-full" alt="" />
                                    ) : <div className="w-6" />}
                                </div>
                            )}
                            
                            <div 
                                className={`max-w-[75%] px-4 py-2 shadow-sm text-[13px] leading-relaxed relative ${
                                    isSentByMe 
                                    ? 'bg-gradient-to-br from-primary to-red-600 text-white rounded-2xl rounded-tr-sm' 
                                    : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100'
                                }`}
                            >
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                <div className={`text-[10px] mt-1 flex items-center justify-end space-x-1 ${isSentByMe ? 'text-white/80' : 'text-gray-400'}`}>
                                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    {isSentByMe && (
                                        <i className={`ri-check-double-line text-sm ${msg.isRead ? 'text-blue-200' : 'text-white/60'}`}></i>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggested Replies Area */}
            <div className="bg-white px-4 py-2 border-t border-gray-50 overflow-x-auto whitespace-nowrap scrollbar-hide flex gap-2">
                {suggestedReplies.map((reply, index) => (
                    <button 
                        key={index}
                        onClick={() => handleSuggestedReply(reply)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded-full border border-gray-200 transition-colors"
                    >
                        {reply}
                    </button>
                ))}
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 bg-white p-3 border-t relative">
                {showEmojiPicker && (
                    <div ref={emojiPickerRef} className="absolute bottom-20 left-4 bg-white shadow-2xl rounded-lg border border-gray-200 p-2 w-64 z-20 grid grid-cols-5 gap-1 animate-fade-in-up">
                        {COMMON_EMOJIS.map(emoji => (
                            <button 
                                key={emoji} 
                                onClick={() => handleEmojiClick(emoji)}
                                className="text-2xl hover:bg-gray-100 p-2 rounded transition-colors"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}

                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

                <form onSubmit={handleSend} className="flex items-end gap-2">
                    <Tooltip content="Add Emoji" position="top">
                        <button 
                            type="button" 
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${showEmojiPicker ? 'text-primary bg-primary/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                        >
                            <i className="ri-emotion-line text-xl"></i>
                        </button>
                    </Tooltip>
                    
                    <Tooltip content="Attach File" position="top">
                        <button 
                            type="button" 
                            onClick={handleFileClick}
                            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <i className="ri-attachment-line text-xl"></i>
                        </button>
                    </Tooltip>
                    
                    <div className="flex-grow relative">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Type a message..."
                            className="w-full bg-gray-100 text-gray-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:bg-white transition-all resize-none max-h-24 thin-scrollbar border border-transparent focus:border-primary/20"
                            rows={1}
                            style={{minHeight: '44px'}}
                        />
                    </div>

                    <Tooltip content="Send Message" position="top">
                        <button 
                            type="submit" 
                            disabled={!newMessage.trim()}
                            className={`w-12 h-12 flex items-center justify-center rounded-full transition-all shadow-md ${newMessage.trim() ? 'bg-primary text-white hover:bg-primary/90 hover:scale-105' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        >
                            <i className="ri-send-plane-fill text-xl ml-0.5"></i>
                        </button>
                    </Tooltip>
                </form>
            </div>
             <style>{`
                .thin-scrollbar::-webkit-scrollbar { width: 5px; }
                .thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .thin-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .bg-chat-pattern {
                    background-color: #f3f4f6;
                    background-image: radial-gradient(#e5e7eb 1px, transparent 1px);
                    background-size: 20px 20px;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default Conversation;
