
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCrm } from '../hooks/useCrm';
import { Lead } from '../types';
import LeadDocuments from '../components/leads/LeadDocuments';
import LeadQuotes from '../components/leads/LeadQuotes';
import LeadActivityTab from '../components/leads/LeadActivityTab';
import LeadCommunicationTab from '../components/leads/LeadCommunicationTab';
import LeadProfileSidebar from '../components/leads/LeadProfileSidebar';
import CallOverlay from '../components/common/CallOverlay';
import PageContainer from '../components/layout/PageContainer';
import { useSwal } from '../hooks/useSwal';
import { generateAvatar } from '../utils/avatar';
import { capitalizeName } from '../utils/formatters';
import { usePermissions } from '../hooks/usePermissions';
import Tooltip from '../components/common/Tooltip';

const TABS = [
    { id: 'activity', name: 'Activity & Notes', icon: 'ri-time-line' },
    { id: 'communication', name: 'Communication', icon: 'ri-message-2-line' },
    { id: 'documents', name: 'Documents', icon: 'ri-file-text-line' },
    { id: 'quotes', name: 'Quotes', icon: 'ri-price-tag-3-line' },
];

// Compact Circular Stepper
const StatusStepper = ({ currentStatus }: { currentStatus: string }) => {
    const steps = ['New Lead', 'Follow-up', 'Won'];
    const isLost = currentStatus === 'Lost';
    
    let activeIndex = steps.indexOf(currentStatus);
    if (activeIndex === -1) {
        if(currentStatus === 'Lost') activeIndex = 1; 
        else activeIndex = 0; 
    }

    return (
        <div className="flex items-center mx-4">
            {steps.map((step, index) => {
                const isCompleted = index < activeIndex;
                const isActive = index === activeIndex;
                const isLast = index === steps.length - 1;

                let circleClass = "bg-gray-100 text-gray-400 border-2 border-gray-200";
                let icon = <span className="text-[10px] font-bold">{index + 1}</span>;
                let labelClass = "text-gray-400 font-medium";
                let lineColor = "bg-gray-200";

                if (isCompleted) {
                    circleClass = "bg-green-100 text-green-600 border-2 border-green-200";
                    icon = <i className="ri-check-line text-sm"></i>;
                    labelClass = "text-green-600 font-semibold";
                    lineColor = "bg-green-400";
                } else if (isActive) {
                    if (isLost) {
                        circleClass = "bg-red-100 text-red-600 border-2 border-red-200";
                        icon = <i className="ri-close-line text-sm"></i>;
                        labelClass = "text-red-600 font-bold";
                    } else if (step === 'Won') {
                        circleClass = "bg-green-600 text-white border-2 border-green-600 shadow-sm";
                        icon = <i className="ri-trophy-line text-sm"></i>;
                        labelClass = "text-green-700 font-bold";
                    } else {
                        circleClass = "bg-blue-600 text-white border-2 border-blue-600 shadow-sm"; 
                        icon = <span className="text-[10px] font-bold">{index + 1}</span>;
                        labelClass = "text-blue-700 font-bold";
                    }
                }

                return (
                    <div key={step} className="flex items-center">
                        <div className="flex flex-col items-center relative group cursor-default">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${circleClass} z-10`}>
                                {icon}
                            </div>
                            <span className={`absolute top-full mt-1 text-[10px] whitespace-nowrap ${labelClass}`}>
                                {step}
                            </span>
                        </div>
                        {!isLast && (
                            <div className={`w-8 sm:w-12 h-0.5 mx-1 rounded ${lineColor}`}></div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const LeadDetailsPage: React.FC = () => {
    const { leadId } = useParams<{ leadId: string }>();
    const navigate = useNavigate();
    const { leads, convertLeadToCustomer, openLeadModal, deleteLead, users, fetchLeadActivities, initiateCall, activeCall } = useCrm();
    const { confirmDelete, fireToast } = useSwal();
    const permissions = usePermissions();

    const [activeTab, setActiveTab] = useState('activity');

    // CRITICAL FIX: Use String() casting to avoid number vs string comparison failure
    const lead = useMemo(() => leads.find(l => String(l.id) === String(leadId)), [leads, leadId]);
    
    const assignedUser = useMemo(() => 
        users.find(u => String(u.id) === String(lead?.assignedToId)), 
    [users, lead]);

    // Fetch activities on mount or when lead changes
    useEffect(() => {
        if (leadId) {
            fetchLeadActivities(leadId);
        }
    }, [leadId, fetchLeadActivities]);

    const handleConvertToCustomer = async () => {
        if (!lead) return;
        const result = await confirmDelete({
            title: 'Convert to Customer?',
            html: `Are you sure you want to convert lead <strong>${lead.name}</strong> to a customer? This will change the lead status to "Won".`,
            confirmButtonText: 'Yes, Convert'
        });

        if (result) {
            try {
                await convertLeadToCustomer(lead);
                fireToast('success', 'Lead converted to customer successfully!');
                navigate('/customers');
            } catch (error: any) {
                fireToast('error', error.message || 'Failed to convert lead.');
            }
        }
    };

    const handleDelete = async () => {
        if (!lead) return;
        const result = await confirmDelete({
            title: 'Delete Lead?',
            html: `Are you sure you want to permanently delete lead "<strong>${lead.name}</strong>"? This action cannot be undone.`,
            confirmButtonText: 'Yes, delete it'
        });

        if (result) {
            try {
                await deleteLead(lead.id);
                fireToast('success', 'Lead deleted successfully');
                navigate('/leads');
            } catch (error: any) {
                fireToast('error', error.message || 'Failed to delete lead');
            }
        }
    };

    if (!lead) {
        return (
            <PageContainer>
                <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <i className="ri-search-line text-3xl text-gray-400"></i>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-700">Lead not found</h2>
                    <p className="text-sm mt-1 mb-6">The lead you are looking for does not exist or has been deleted.</p>
                    <button onClick={() => navigate('/leads')} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
                        Back to Leads
                    </button>
                </div>
            </PageContainer>
        );
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'activity': return <LeadActivityTab lead={lead} />;
            case 'documents': return <LeadDocuments lead={lead} />;
            case 'communication': return <LeadCommunicationTab lead={lead} />;
            case 'quotes': return <LeadQuotes lead={lead} />;
            default: return null;
        }
    }

    const avatarSrc = generateAvatar(lead.name);

    return (
        <PageContainer>
            <div className="max-w-[1400px] mx-auto pb-10 space-y-6">
                
                {/* 1. TOP NAVIGATION & BREADCRUMB */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <button onClick={() => navigate('/leads')} className="hover:text-primary transition-colors flex items-center gap-1">
                        <i className="ri-arrow-left-line"></i> Leads
                    </button>
                    <span>/</span>
                    <span className="text-gray-800 font-medium">{lead.name}</span>
                </div>

                {/* 2. HERO HEADER CARD */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 relative overflow-visible">
                    
                    <div className="flex flex-col xl:flex-row gap-6 justify-between items-center">
                        
                        {/* Left: Identity */}
                        <div className="flex items-start gap-4 w-full xl:w-auto self-start xl:self-center">
                            <img src={avatarSrc} alt={lead.name} className="w-16 h-16 rounded-full border-4 border-gray-50 shadow-sm flex-shrink-0" />
                            <div className="flex-grow min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-xl font-bold text-gray-900 truncate">{lead.name}</h1>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                        lead.leadStatus === 'Won' ? 'bg-green-50 text-green-700 border-green-200' :
                                        lead.leadStatus === 'Lost' ? 'bg-red-50 text-red-700 border-red-200' :
                                        'bg-blue-50 text-blue-700 border-blue-200'
                                    }`}>
                                        {lead.leadStatus}
                                    </span>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                    <span className="flex items-center gap-1 truncate text-gray-700">
                                        <i className="ri-building-line text-gray-400"></i>
                                        {lead.companyName || 'Individual'}
                                    </span>
                                    <span className="text-gray-300">|</span>
                                    <span className="flex items-center gap-1 truncate">
                                        <i className="ri-map-pin-line text-gray-400"></i>
                                        {lead.location || 'Unknown'}
                                    </span>
                                    {assignedUser && (
                                        <>
                                            <span className="text-gray-300">|</span>
                                            <span className="flex items-center gap-1 truncate bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                                                <i className="ri-user-star-line text-gray-500"></i>
                                                {capitalizeName(assignedUser.name)}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Center: Circular Stepper */}
                        <div className="w-full xl:w-auto flex justify-center py-2 xl:py-0 border-t xl:border-t-0 xl:border-l xl:border-r border-gray-100 xl:px-6">
                            <StatusStepper currentStatus={lead.leadStatus} />
                        </div>

                        {/* Right: Quick Actions */}
                        <div className="flex flex-wrap gap-2 w-full xl:w-auto justify-center xl:justify-end items-center">
                            
                            {/* Icons Group */}
                            <div className="flex gap-2">
                                <Tooltip content="Call Client" position="bottom">
                                    <button 
                                        onClick={() => initiateCall(lead.id, lead.name, lead.phone)}
                                        disabled={!!activeCall}
                                        className={`w-9 h-9 flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm ${!!activeCall ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <i className="ri-phone-fill text-lg"></i>
                                    </button>
                                </Tooltip>
                                
                                <Tooltip content="WhatsApp Chat" position="bottom">
                                    <a 
                                        href={`https://wa.me/${lead.phone}`} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-green-200 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm"
                                    >
                                        <i className="ri-whatsapp-fill text-xl"></i>
                                    </a>
                                </Tooltip>
                                
                                <Tooltip content="Send Email" position="bottom">
                                    <a 
                                        href={`mailto:${lead.email}`} 
                                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white transition-all shadow-sm"
                                    >
                                        <i className="ri-mail-send-fill text-lg"></i>
                                    </a>
                                </Tooltip>
                            </div>
                            
                            <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block"></div>

                            {/* Buttons Group */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => navigate(`/leads/${lead.id}/proforma-invoice`)}
                                    className="px-3 py-2 bg-white border border-indigo-200 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition-all text-xs flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                                >
                                    <i className="ri-file-paper-2-line text-sm"></i> Proforma Invoice
                                </button>
                                <button 
                                    onClick={() => openLeadModal(lead)}
                                    className="px-3 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:text-primary hover:border-primary transition-all text-xs flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                                >
                                    <i className="ri-pencil-line text-sm"></i> Edit
                                </button>
                                
                                {permissions.can('leads', 'delete') && (
                                    <button 
                                        onClick={handleDelete}
                                        className="px-3 py-2 bg-white border border-red-200 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-all text-xs flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                                    >
                                        <i className="ri-delete-bin-line text-sm"></i> Delete
                                    </button>
                                )}

                                {lead.leadStatus !== 'Won' && (
                                    <button 
                                        onClick={handleConvertToCustomer}
                                        className="px-3 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 hover:shadow-md transition-all text-xs flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                                    >
                                        <i className="ri-check-double-line text-sm"></i> Convert to Customer
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* 3. MAIN CONTENT GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* LEFT SIDEBAR: Static Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <LeadProfileSidebar lead={lead} />
                    </div>

                    {/* RIGHT CONTENT: Dynamic Tabs */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] flex flex-col">
                            {/* Tab Navigation */}
                            <div className="border-b border-gray-200 px-2 sm:px-6">
                                <nav className="-mb-px flex space-x-6 overflow-x-auto scrollbar-hide">
                                    {TABS.map(tab => (
                                         <button 
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)} 
                                            className={`
                                                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2
                                                ${activeTab === tab.id 
                                                    ? 'border-primary text-primary' 
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                }
                                            `}
                                        >
                                            <i className={`${tab.icon} text-lg`}></i>
                                            {tab.name}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                            
                            <div className="p-6 flex-grow bg-white">
                                <div className="animate-fade-in-up">
                                    {renderTabContent()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <CallOverlay />

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.3s ease-out forwards;
                }
            `}</style>
        </PageContainer>
    );
};

export default LeadDetailsPage;
