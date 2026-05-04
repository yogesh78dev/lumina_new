
import React, { useState, useMemo } from 'react';
import { useCrm } from '../../hooks/useCrm';
import { User } from '../../types';
import { generateAvatar } from '../../utils/avatar';
import { capitalizeName } from '../../utils/formatters';

interface UserListProps {
    onSelectUser: (user: User) => void;
}

const UserList: React.FC<UserListProps> = ({ onSelectUser }) => {
    const { users, currentUser, getUnreadMessageCountForUser, getLastMessageForUser } = useCrm();
    const [searchTerm, setSearchTerm] = useState('');

    if (!currentUser) return null;

    const otherUsers = users.filter(user => String(user.id) !== String(currentUser.id));

    // Mock Online Status logic (Random for demo, would be real-time in prod)
    const isOnline = (userId: string | number) => {
        // Simple hash to keep status consistent per user session
        const userIdStr = String(userId);
        const hash = userIdStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return hash % 2 === 0; 
    };

    const filteredConversations = useMemo(() => {
        let conversationList = otherUsers.map(user => ({
            user,
            // FIX line 29, 30, 31: cast user.id to string
            lastMessage: getLastMessageForUser(String(user.id)),
            unreadCount: getUnreadMessageCountForUser(String(user.id)),
            online: isOnline(String(user.id))
        }));

        // Sort: Unread first, then by latest message date
        conversationList.sort((a, b) => {
            if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
            if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
            
            const timeA = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
            const timeB = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
            return timeB - timeA;
        });

        // Filter by Search
        if (searchTerm) {
            conversationList = conversationList.filter(c => 
                c.user.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return conversationList;
    }, [otherUsers, getLastMessageForUser, getUnreadMessageCountForUser, searchTerm]);

    const formatTimestamp = (timestamp: string): string => {
        const messageDate = new Date(timestamp);
        const now = new Date();
        
        if (messageDate.toDateString() === now.toDateString()) {
            return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (messageDate.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        }
        
        return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Search Header */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <div className="relative">
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input 
                        type="text" 
                        placeholder="Search team members..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>
            </div>

            {/* User List */}
            <div className="flex-grow overflow-y-auto thin-scrollbar">
                {filteredConversations.length > 0 ? (
                    <ul className="divide-y divide-gray-50">
                        {filteredConversations.map(({ user, lastMessage, unreadCount, online }) => {
                            const avatarSrc = user.imageUrl || generateAvatar(user.name);

                            return (
                                <li key={user.id}>
                                    <button 
                                        onClick={() => onSelectUser(user)} 
                                        className={`w-full text-left flex items-center p-3 sm:p-4 space-x-3 transition-all duration-200 ${unreadCount > 0 ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-gray-50'}`}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <img src={avatarSrc} alt={user.name} className="w-12 h-12 rounded-full object-cover border border-gray-100 shadow-sm" />
                                            {online && (
                                                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                                            )}
                                        </div>
                                        
                                        <div className="flex-grow min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <p className={`text-sm font-semibold truncate ${unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {capitalizeName(user.name)}
                                                </p>
                                                {lastMessage && (
                                                    <p className={`text-[10px] sm:text-xs flex-shrink-0 ${unreadCount > 0 ? 'text-primary font-bold' : 'text-gray-400'}`}>
                                                        {formatTimestamp(lastMessage.timestamp)}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className={`text-xs sm:text-sm truncate pr-2 ${unreadCount > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                                                    {lastMessage ? lastMessage.content : <span className="italic text-gray-400">Start a conversation</span>}
                                                </p>
                                                {unreadCount > 0 && (
                                                    <span className="h-5 min-w-[20px] px-1.5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                                                        {unreadCount > 9 ? '9+' : unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-500">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <i className="ri-user-search-line text-2xl text-gray-400"></i>
                        </div>
                        <h4 className="font-semibold text-gray-700 text-sm">No users found</h4>
                        <p className="text-xs mt-1 text-gray-400">Try a different search term.</p>
                    </div>
                )}
            </div>
             <style>{`
                .thin-scrollbar::-webkit-scrollbar { width: 5px; }
                .thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .thin-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 3px; }
                .thin-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
            `}</style>
        </div>
    );
};

export default UserList;
