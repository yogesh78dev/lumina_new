
import React, { useState } from 'react';
import { Lead } from '../../types';
import LeadCard from './LeadCard';

interface KanbanColumnProps {
    status: string;
    leads: Lead[];
    onDrop: (leadId: string, newStatus: string) => void;
    onCardClick: (lead: Lead) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'New Lead': return 'bg-blue-500';
    case 'Follow-up': return 'bg-amber-500';
    case 'Won': return 'bg-green-500';
    case 'Lost': return 'bg-gray-500';
    default: return 'bg-gray-400';
  }
};

const getStatusBg = (status: string) => {
    switch (status) {
      case 'New Lead': return 'bg-blue-50/50 border-blue-100';
      case 'Follow-up': return 'bg-amber-50/50 border-amber-100';
      case 'Won': return 'bg-green-50/50 border-green-100';
      case 'Lost': return 'bg-gray-50/50 border-gray-100';
      default: return 'bg-gray-50 border-gray-200';
    }
};


const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, leads, onDrop, onCardClick }) => {
    const [isOver, setIsOver] = useState(false);

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
            onDrop(leadId, status);
        }
    };

    return (
        <div 
            className={`rounded-xl w-[320px] flex-shrink-0 flex flex-col h-full max-h-full border transition-colors ${getStatusBg(status)} ${isOver ? 'ring-2 ring-primary ring-opacity-50' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Sticky Header */}
            <div className="p-3 pb-2 flex-shrink-0 sticky top-0 z-10 rounded-t-xl backdrop-blur-sm bg-opacity-90">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(status)} shadow-sm`}></div>
                        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">{status}</h3>
                    </div>
                    <span className="text-xs font-bold text-gray-500 bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-sm">
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
