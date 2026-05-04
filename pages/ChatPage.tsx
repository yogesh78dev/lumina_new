
import React, { useState, useEffect } from 'react';
import { useCrm } from '../hooks/useCrm';
import UserList from '../components/chat/UserList';
import Conversation from '../components/chat/Conversation';
import { User } from '../types';
import PageContainer from '../components/layout/PageContainer';
import Tooltip from '../components/common/Tooltip';

const ChatPage: React.FC = () => {
    const { markMessagesAsRead } = useCrm();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    useEffect(() => {
        if (selectedUser) {
            // FIX: Cast selectedUser.id to string to match markMessagesAsRead expected parameter type
            markMessagesAsRead(String(selectedUser.id));
        }
    }, [selectedUser, markMessagesAsRead]);

    return (
        // Use !overflow-hidden to ensure the PageContainer doesn't scroll, relying on internal chat areas to scroll.
        <PageContainer className="p-0 sm:p-0 h-full !overflow-hidden"> 
            <div className="h-full flex bg-white overflow-hidden relative">
                {/* Left Sidebar: User List */}
                <div className={`w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col bg-white h-full ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                        <h2 className="text-xl font-bold text-gray-800">Messages</h2>
                        <Tooltip content="New Message">
                            <button className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-primary rounded-full hover:bg-gray-100 transition-colors">
                                <i className="ri-edit-box-line text-xl"></i>
                            </button>
                        </Tooltip>
                    </div>
                    <div className="flex-grow overflow-hidden">
                        <UserList onSelectUser={setSelectedUser} />
                    </div>
                </div>

                {/* Right Content: Conversation */}
                <div className={`flex-1 flex flex-col bg-gray-50 w-full h-full ${selectedUser ? 'flex' : 'hidden md:flex'}`}>
                    {selectedUser ? (
                        <>
                            {/* Mobile Back Button (Rendered within Conversation header normally, but keeping structure here for clarity) */}
                            <div className="md:hidden bg-white border-b px-4 py-2 flex items-center">
                                <button 
                                    onClick={() => setSelectedUser(null)} 
                                    className="mr-3 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-700 hover:text-primary"
                                >
                                    <i className="ri-arrow-left-line text-lg"></i>
                                </button>
                                <span className="font-semibold text-gray-700">Back</span>
                            </div>
                            <Conversation contact={selectedUser} />
                        </>
                    ) : (
                        <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-400">
                            <div className="w-40 h-40 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                <i className="ri-chat-smile-3-line text-7xl text-gray-300"></i>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-700 mb-2">Team Chat</h2>
                            <p className="text-gray-500">Select a team member to start a conversation.</p>
                            <div className="mt-8 text-sm text-gray-400 flex items-center gap-2">
                                <i className="ri-lock-line"></i> End-to-end encrypted
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PageContainer>
    );
};

export default ChatPage;
