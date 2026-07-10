
import React from 'react';
import { Lead } from '../../types';
import { useCrm } from '../../hooks/useCrm';
import KanbanColumn from './KanbanColumn';
import { usePermissions } from '../../hooks/usePermissions';
import { useSwal } from '../../hooks/useSwal';

interface LeadKanbanViewProps {
    leads: Lead[];
}

const LeadKanbanView: React.FC<LeadKanbanViewProps> = ({ leads }) => {
    const { leadStatuses, updateLead, openLeadModal } = useCrm();
    const permissions = usePermissions();
    const { fireToast } = useSwal();
    const canUpdate = permissions.can('leads', 'update');

    const handleDrop = async (leadId: string, newStatus: string) => {
        if (!canUpdate) return;
        
        // Find the lead using string comparison to avoid number/string mismatch issues
        const lead = leads.find(l => String(l.id) === String(leadId));
        
        if (lead && lead.leadStatus !== newStatus) {
            try {
                const updatedLead = { ...lead, leadStatus: newStatus };
                await updateLead(updatedLead);
                fireToast('success', `Lead "${lead.name}" moved to ${newStatus}`);
            } catch (error) {
                fireToast('error', 'Failed to move lead. Please try again.');
            }
        }
    };

    const handleCardClick = (lead: Lead) => {
        openLeadModal(lead);
    }

    const leadsByStatus = leadStatuses.map(status => ({
        ...status,
        leads: leads.filter(lead => lead.leadStatus === status.name)
    }));

    return (
        <div className="h-full min-h-0 flex flex-col overflow-hidden">
             <div className="flex-grow min-h-0 flex gap-3 sm:gap-4 overflow-x-auto overflow-y-hidden pb-4 px-1 sm:px-2 items-stretch kanban-board-scroll">
                {leadsByStatus.map(statusGroup => (
                    <KanbanColumn
                        key={statusGroup.id}
                        status={statusGroup}
                        leads={statusGroup.leads}
                        onDrop={handleDrop}
                        onCardClick={handleCardClick}
                    />
                ))}
            </div>
            <style>{`
                .kanban-board-scroll {
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: thin;
                }
                .kanban-board-scroll::-webkit-scrollbar {
                    height: 8px;
                }
                .kanban-board-scroll::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 999px;
                }
            `}</style>
        </div>
    );
}

export default LeadKanbanView;
