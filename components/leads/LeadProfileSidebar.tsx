
import React from 'react';
import { Lead } from '../../types';
import { useCrm } from '../../hooks/useCrm';
import { capitalizeName, formatDateDDMMYYYY } from '../../utils/formatters';

interface LeadProfileSidebarProps {
    lead: Lead;
}

const LeadProfileSidebar: React.FC<LeadProfileSidebarProps> = ({ lead }) => {
    
    const DetailRow = ({ icon, label, value, isLink, href, copyable }: { icon: string, label: string, value?: string, isLink?: boolean, href?: string, copyable?: boolean }) => (
        <div className="flex items-start py-3 border-b border-gray-50 last:border-0 group hover:bg-gray-50/50 transition-colors px-2 rounded-md">
            <div className="w-8 flex-shrink-0 pt-0.5 text-gray-400">
                <i className={`${icon} text-base`}></i>
            </div>
            <div className="flex-grow min-w-0">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                <div className="flex items-center justify-between gap-2">
                     {isLink && href ? (
                        <a href={href} className="text-sm font-medium text-gray-900 hover:text-primary transition-colors truncate block" target="_blank" rel="noreferrer">
                            {value || '-'}
                        </a>
                    ) : (
                        <p className="text-sm font-medium text-gray-900 truncate">{value || '-'}</p>
                    )}
                    {copyable && value && (
                        <button 
                            onClick={() => { navigator.clipboard.writeText(value); }} 
                            className="text-gray-300 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            title="Copy"
                        >
                            <i className="ri-file-copy-line"></i>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            
            {/* 1. Contact Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        Client Details
                    </h3>
                </div>
                <div className="p-4">
                    <DetailRow icon="ri-phone-line" label="Phone" value={lead.phone} isLink href={`tel:${lead.phone}`} copyable />
                    {lead.phone2 && <DetailRow icon="ri-phone-line" label="Phone 2" value={lead.phone2} isLink href={`tel:${lead.phone2}`} copyable />}
                    {lead.phone3 && <DetailRow icon="ri-phone-line" label="Phone 3" value={lead.phone3} isLink href={`tel:${lead.phone3}`} copyable />}
                    {lead.phone4 && <DetailRow icon="ri-phone-line" label="Phone 4" value={lead.phone4} isLink href={`tel:${lead.phone4}`} copyable />}
                    <DetailRow icon="ri-mail-line" label="Email" value={lead.email} isLink href={`mailto:${lead.email}`} copyable />
                    <DetailRow icon="ri-building-line" label="Company" value={lead.companyName} />
                    <DetailRow icon="ri-map-pin-line" label="Location" value={lead.location} />
                    <DetailRow icon="ri-global-line" label="Country" value={lead.country} />
                </div>
            </div>

            {/* 2. Requirement / Deal Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        Requirement Info
                    </h3>
                </div>
                <div className="p-4">
                    <DetailRow icon="ri-price-tag-3-line" label="Lead Type" value={lead.leadType} />
                    <DetailRow icon="ri-briefcase-line" label="Service" value={lead.service} />
                    <DetailRow icon="ri-folder-2-line" label="Lead Category" value={lead.leadCategory} />
                    <DetailRow icon="ri-links-line" label="Source" value={lead.leadSource} />
                    
                    {/* Application Status and Passport Status are intentionally hidden for now. */}
                </div>
            </div>

            {/* 3. System Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                 <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/30">
                    <h3 className="text-sm font-bold text-gray-800">System Info</h3>
                </div>
                <div className="p-4">
                    <div className="flex justify-between items-center py-2 text-xs text-gray-500 border-b border-gray-50 last:border-0">
                        <span>Lead ID</span>
                        {/* FIX: Cast lead.id to string before calling split */}
                        <span className="font-mono text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">{String(lead.id).split('-')[0]}...</span>
                    </div>
                    <div className="flex justify-between items-center py-2 text-xs text-gray-500 border-b border-gray-50 last:border-0">
                        <span>Created On</span>
                        <span className="font-medium text-gray-700">{formatDateDDMMYYYY(lead.createdAt)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 text-xs text-gray-500 border-b border-gray-50 last:border-0">
                        <span>Last Activity</span>
                        <span className="font-medium text-gray-700">
                            {lead.lastActivityAt ? new Date(lead.lastActivityAt).toLocaleDateString() : 'N/A'}
                        </span>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default LeadProfileSidebar;
