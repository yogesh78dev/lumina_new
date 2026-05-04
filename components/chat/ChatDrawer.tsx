
import React, { useState, useEffect } from 'react';
import { useCrm } from '../../hooks/useCrm';
import { User } from '../../types';
import UserList from './UserList';
import Conversation from './Conversation';
import { capitalizeName } from '../../utils/formatters';
import { generateAvatar } from '../../utils/avatar';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({ isOpen, onClose }) => {
  const { markMessagesAsRead } = useCrm();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    if (selectedUser) {
      // FIX: Cast selectedUser.id to string to match markMessagesAsRead expected parameter type
      markMessagesAsRead(String(selectedUser.id));
    }
  }, [selectedUser, markMessagesAsRead]);

  // Reset selected user when drawer is closed
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setSelectedUser(null), 300); // Wait for transition
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
  };

  const handleBack = () => {
    setSelectedUser(null);
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="bg-white text-gray-800 p-4 flex items-center justify-between flex-shrink-0 shadow-sm border-b z-10">
          {selectedUser ? (
            <button onClick={handleBack} className="text-gray-500 hover:bg-gray-100 rounded-full p-1 -ml-1">
              <i className="ri-arrow-left-s-line text-2xl"></i>
            </button>
          ) : <div className="w-8"></div>}
          
          <div className="flex items-center gap-3 truncate">
             {selectedUser && (
                <img 
                    src={selectedUser.imageUrl || generateAvatar(selectedUser.name)} 
                    alt={selectedUser.name} 
                    className="w-9 h-9 rounded-full object-cover" 
                />
            )}
            <h3 className="text-lg font-semibold truncate">
                {selectedUser ? capitalizeName(selectedUser.name) : 'Team Chat'}
            </h3>
          </div>
          
          <button onClick={onClose} className="text-gray-500 hover:bg-gray-100 rounded-full p-1 -mr-1">
            <i className="ri-close-line text-xl"></i>
          </button>
        </header>

        <div className="flex-grow overflow-hidden relative">
          <div className={`transition-transform duration-300 ease-in-out w-full h-full absolute top-0 left-0 ${selectedUser ? '-translate-x-full' : 'translate-x-0'}`}>
            <UserList onSelectUser={handleSelectUser} />
          </div>
          <div className={`transition-transform duration-300 ease-in-out w-full h-full absolute top-0 left-0 ${selectedUser ? 'translate-x-0' : 'translate-x-full'}`}>
            {selectedUser && <Conversation contact={selectedUser} />}
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatDrawer;
