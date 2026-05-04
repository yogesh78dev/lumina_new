import React, { useState, useEffect } from 'react';
import { useCrm } from '../../hooks/useCrm';
import ChatPanel from './ChatPanel';

const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { getTotalUnreadMessages, currentUser } = useCrm();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        // Poll for unread messages to update the badge, as localStorage doesn't trigger re-renders
        const interval = setInterval(() => {
            setUnreadCount(getTotalUnreadMessages());
        }, 1000); // Check every second

        return () => clearInterval(interval);
    }, [getTotalUnreadMessages, currentUser]);

    return (
        <>
            <div className="fixed bottom-8 right-8 z-50">
                <button 
                    onClick={() => setIsOpen(!isOpen)} 
                    className="w-16 h-16 bg-primary text-white rounded-full shadow-lg flex items-center justify-center text-3xl hover:bg-primary/90 transition-transform duration-300 hover:scale-110"
                    aria-label={isOpen ? "Close chat" : "Open chat"}
                >
                    <i className={`transition-transform duration-500 ${isOpen ? 'ri-close-line' : 'ri-chat-3-line'}`}></i>
                    {unreadCount > 0 && !isOpen && (
                        <span className="absolute -top-1 -right-1 w-6 h-6 bg-secondary text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </div>
            <div 
                className={`fixed bottom-28 right-8 z-50 w-[360px] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col transition-all duration-500 ease-in-out ${
                    isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
                }`}
            >
                {isOpen && <ChatPanel onClose={() => setIsOpen(false)} />}
            </div>
        </>
    );
};

export default ChatWidget;