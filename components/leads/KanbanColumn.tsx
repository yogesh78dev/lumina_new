
import React, { useState } from 'react';
import { Lead, LeadStatus } from '../../types';
import LeadCard from './LeadCard';
import { getStatusVisual } from '../../utils/statusColors';

interface KanbanColumnProps {
    status: LeadStatus;
    leads: Lead[];
    onDrop: (leadId: string, newStatus: string) => void;
    onCardClick: (lead: Lead) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, leads, onDrop, onCardClick }) => {
    const [isOver, setIsOver] = useState(false);
    const statusVisual = getStatusVisual(status.color || '#64748b');

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(false);
        const leadId = e.dataTransfer.getData('leadId');
        if (leadId) {
            onDrop(leadId, status.name);
        }
    };

    return (
        <div 
            className={`rounded-xl w-[320px] flex-shrink-0 flex flex-col h-full max-h-full border transition-colors ${isOver ? 'ring-2 ring-primary ring-opacity-50' : ''}`}
            style={{ borderColor: statusVisual.borderColor, backgroundColor: statusVisual.backgroundColor }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Sticky Header */}
            <div className="p-3 pb-2 flex-shrink-0 sticky top-0 z-10 rounded-t-xl backdrop-blur-sm bg-opacity-90">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: statusVisual.color, boxShadow: `0 0 0 3px ${statusVisual.strongBackgroundColor}` }}></div>
                        <h3 className="font-bold text-sm uppercase tracking-wide" style={{ color: statusVisual.color }}>{status.name}</h3>
                    </div>
                    <span className="text-xs font-bold bg-white px-2 py-0.5 rounded-md border shadow-sm" style={{ color: statusVisual.color, borderColor: statusVisual.borderColor }}>
                        {leads.length}
                    </span>
                </div>
            </div>

            {/* Scrollable Card Area */}
            <div className={`flex-grow p-2 overflow-y-auto overflow-x-hidden kanban-scrollbar space-y-3 ${isOver ? 'bg-primary/5' : ''}`}>
                {leads.map(lead => (
                    <LeadCard key={lead.id} lead={lead} onClick={() => onCardClick(lead)} />
                ))}
                
                {leads.length === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg bg-white/50 m-1">
                        <i className="ri-drag-move-2-line text-2xl mb-1 opacity-50"></i>
                        <span className="text-xs font-medium">Drop items here</span>
                    </div>
                )}
                
                {/* Spacer for bottom scrolling */}
                <div className="h-2"></div>
            </div>

            <style>{`
                .kanban-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .kanban-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .kanban-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .kanban-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </div>
    );
}

export default KanbanColumn;
