
import React from 'react';
import { Lead } from '../../types';
import { useCrm } from '../../hooks/useCrm';
import { generateAvatar } from '../../utils/avatar';
import Tooltip from '../common/Tooltip';

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
}

const getSourceColor = (source: string) => {
    const sourceLower = source.toLowerCase();
    if (sourceLower.includes('google')) return 'bg-blue-50 text-blue-700 border-blue-100';
    if (sourceLower.includes('ivr')) return 'bg-pink-50 text-pink-700 border-pink-100';
    if (sourceLower.includes('website')) return 'bg-purple-50 text-purple-700 border-purple-100';
    if (sourceLower.includes('social')) return 'bg-cyan-50 text-cyan-700 border-cyan-100';
    if (sourceLower.includes('direct')) return 'bg-orange-50 text-orange-700 border-orange-100';
    return 'bg-gray-50 text-gray-700 border-gray-100';
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onClick }) => {
  const { users } = useCrm();
  const assignedUser = users.find(u => String(u.id) === String(lead.assignedToId));

  const notesCount = lead.notesCount || 0;
  const remindersCount = lead.remindersCount || 0;

  const isRotting = React.useMemo(() => {
      if (['Won', 'Lost'].includes(lead.leadStatus)) return false;
      const lastActivity = lead.lastActivityAt || lead.createdAt;
      const hoursInactive = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);
      return hoursInactive > 72;
  }, [lead]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('leadId', String(lead.id));
    e.currentTarget.classList.add('opacity-50', 'scale-95', 'shadow-xl');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50', 'scale-95', 'shadow-xl');
  };

  const avatarSrc = assignedUser?.imageUrl || generateAvatar(assignedUser?.name || '?');

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      className={`
        bg-white rounded-lg p-3 cursor-grab active:cursor-grabbing 
        border-l-[3px] border-y border-r border-gray-200 
        shadow-sm hover:shadow-md transition-all duration-200 group/card relative
        ${isRotting ? 'border-l-red-500' : 'border-l-primary'}
      `}
    >
      <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0 pr-2">
              <h4 className="text-sm font-semibold text-gray-800 leading-snug truncate" title={lead.name}>
                  {lead.name}
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                  {new Date(lead.createdAt).toLocaleDateString([], {month:'short', day:'numeric'})}
              </p>
          </div>
          
          {assignedUser ? (
             <Tooltip content={`Assigned to: ${assignedUser.name}`} position="left">
                 <div className="flex-shrink-0">
                    <img 
                        src={avatarSrc}
                        alt={assignedUser.name}
                        className="w-7 h-7 rounded-full object-cover border border-gray-100 shadow-sm"
                    />
                </div>
            </Tooltip>
          ) : (
             <Tooltip content="Unassigned" position="left">
                 <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                     <i className="ri-user-unfollow-line text-gray-400 text-xs"></i>
                 </div>
             </Tooltip>
          )}
      </div>

      <div className="space-y-1.5 mb-3">
         {lead.service && (
            <div className="flex items-center text-xs text-gray-600">
                <i className="ri-briefcase-line text-gray-400 mr-1.5"></i>
                <span className="truncate max-w-[180px]">{lead.service}</span>
            </div>
         )}
         {lead.phone && (
            <div className="flex items-center text-xs text-gray-600">
                <i className="ri-phone-line text-gray-400 mr-1.5"></i>
                <span className="truncate">{lead.phone}</span>
            </div>
         )}
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-gray-50">
        <div className="flex items-center gap-3">
            <div className={`flex items-center text-[10px] font-medium ${notesCount > 0 ? 'text-gray-600' : 'text-gray-300'}`} title="Notes">
                <i className="ri-message-2-line mr-1 text-xs"></i> {notesCount}
            </div>
            <div className={`flex items-center text-[10px] font-medium ${remindersCount > 0 ? 'text-amber-600' : 'text-gray-300'}`} title="Pending Tasks">
                <i className="ri-calendar-check-line mr-1 text-xs"></i> {remindersCount}
            </div>
             {isRotting && (
                <div className="flex items-center text-[10px] text-red-500 font-medium" title="Inactive for > 3 days">
                    <i className="ri-alarm-warning-line mr-1"></i> Late
                </div>
            )}
        </div>
        
        {lead.leadSource && (
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getSourceColor(lead.leadSource)} max-w-[80px] truncate`}>
                {lead.leadSource}
            </span>
        )}
      </div>
    </div>
  );
};

export default LeadCard;
