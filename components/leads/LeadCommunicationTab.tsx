import React, { useState } from 'react';
import { Lead } from '../../types';
import LeadEmails from './LeadEmails';
import LeadWhatsApp from './LeadWhatsApp';
import LeadVoiceCalls from './LeadVoiceCalls';

const LeadCommunicationTab: React.FC<{ lead: Lead }> = ({ lead }) => {
    const [activeCommTab, setActiveCommTab] = useState<'email' | 'whatsapp' | 'voice'>('email');

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-center mb-6">
                <div className="bg-gray-100 p-1 rounded-lg inline-flex shadow-inner">
                    <button 
                        onClick={() => setActiveCommTab('email')} 
                        className={`px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${
                            activeCommTab === 'email' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <i className="ri-mail-line"></i> Email
                    </button>
                     <button 
                        onClick={() => setActiveCommTab('whatsapp')} 
                        className={`px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${
                            activeCommTab === 'whatsapp' 
                            ? 'bg-white text-green-700 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <i className="ri-whatsapp-line"></i> WhatsApp
                    </button>
                    <button 
                        onClick={() => setActiveCommTab('voice')} 
                        className={`px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${
                            activeCommTab === 'voice' 
                            ? 'bg-white text-blue-700 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <i className="ri-phone-line"></i> Voice Calls
                    </button>
                </div>
            </div>

            <div className="flex-grow">
                {activeCommTab === 'email' && <LeadEmails lead={lead} />}
                {activeCommTab === 'whatsapp' && <LeadWhatsApp lead={lead} />}
                {activeCommTab === 'voice' && <LeadVoiceCalls lead={lead} />}
            </div>
        </div>
    );
};

export default LeadCommunicationTab;