
import React, { useState, useEffect } from 'react';
import { useCrm } from '../../hooks/useCrm';
import { User } from '../../types';
import UserList from './UserList';
import Conversation from './Conversation';
import { capitalizeName } from '../../utils/formatters';

interface ChatPanelProps {
    onClose: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ onClose }) => {
    const { markMessagesAsRead } = useCrm();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    useEffect(() => {
        if (selectedUser) {
            // FIX line 18: cast selectedUser.id to string
            markMessagesAsRead(String(selectedUser.id));
        }
    }, [selectedUser, markMessagesAsRead]);

    return (
        <div className="w-full h-full flex flex-col">
            <header className="bg-primary text-white p-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
                {selectedUser ? (
                     <>
                        <button onClick={() => setSelectedUser(null)} className="text-white hover:bg-white/20 rounded-full p-1 -ml-1">
                            <i className="ri-arrow-left-s-line text-2xl"></i>
                        </button>
                        <h3 className="text-lg font-semibold">{capitalizeName(selectedUser.name)}</h3>
                    </>
                ) : (
                     <h3 className="text-lg font-semibold">Team Chat</h3>
                )}
                <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-1 -mr-1">
                    <i className="ri-close-line text-xl"></i>
                </button>
            </header>
            
            <div className="flex-grow overflow-hidden transition-all duration-300">
                {selectedUser ? (
                    <Conversation contact={selectedUser} />
                ) : (
                    <UserList onSelectUser={setSelectedUser} />
                )}
            </div>
        </div>
    );
};

export default ChatPanel;
