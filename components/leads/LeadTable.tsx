
import React, { useState } from 'react';
import { Lead, LeadTableColumn } from '../../types';
import { useCrm } from '../../hooks/useCrm';
import { usePermissions } from '../../hooks/usePermissions';
import { Link } from 'react-router-dom';
import { useSwal } from '../../hooks/useSwal';
import { capitalizeName } from '../../utils/formatters';

interface LeadTableProps {
  leads: Lead[];
  visibleColumns: LeadTableColumn[];
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  requestSort: (key: keyof Lead) => void;
  sortConfig: { key: keyof Lead; direction: string } | null;
}

const LeadTable: React.FC<LeadTableProps> = ({ leads, visibleColumns, selectedIds, setSelectedIds, requestSort, sortConfig }) => {
  const { leadSources, leadStatuses, applicationStatuses, passportStatuses, users, updateLead, deleteLead, addNoteForLead } = useCrm();
  const permissions = usePermissions();
  const { fireToast, confirmDelete } = useSwal();
  const canUpdateLeads = permissions.can('leads', 'update');
  const canDeleteLeads = permissions.can('leads', 'delete');

  const [quickNoteInputs, setQuickNoteInputs] = useState<Record<string, string>>({});

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIdsOnPage = new Set(leads.map(l => String(l.id)));
      setSelectedIds(allIdsOnPage);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
    } else {
      newSelectedIds.add(id);
    }
    setSelectedIds(newSelectedIds);
  };
  
  const handleInlineUpdate = (lead: Lead, field: keyof Lead, value: any) => {
    const updatedLead = { ...lead, [field]: value };
    updateLead(updatedLead);
  };

  const handleQuickNoteChange = (leadId: string, value: string) => {
    setQuickNoteInputs(prev => ({ ...prev, [leadId]: value }));
  };

  const handleQuickNoteSubmit = (leadId: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        const noteContent = quickNoteInputs[leadId]?.trim();
        if (noteContent) {
            addNoteForLead(String(leadId), noteContent);
            setQuickNoteInputs(prev => ({ ...prev, [leadId]: '' }));
            fireToast('success', 'Remark added successfully');
        }
    }
  };

  const handleDelete = async (lead: Lead) => {
      const result = await confirmDelete({
          title: 'Delete Lead?',
          html: `Are you sure you want to delete lead "<strong>${lead.name}</strong>"? This action cannot be undone.`,
          confirmButtonText: 'Yes, delete it'
      });

      if (result) {
          try {
              await deleteLead(lead.id);
              fireToast('success', 'Lead deleted successfully');
          } catch (error: any) {
              fireToast('error', error.message || 'Failed to delete lead');
          }
      }
  };
  
  const isLeadRotting = (lead: Lead) => {
      if (['Won', 'Lost'].includes(lead.leadStatus)) return false;
      const lastActivity = lead.lastActivityAt || lead.createdAt;
      const hoursInactive = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);
      return hoursInactive > 72;
  };

  const getSelectClass = (type: 'source' | 'status' | 'app' | 'default') => {
      const base = "w-full p-1.5 border rounded-md text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors cursor-pointer appearance-none pl-2 pr-6";
      const bgImage = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`;
      const bgStyle = { backgroundImage: bgImage, backgroundPosition: 'right 0.2rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' };
      
      switch(type) {
          case 'status': return { className: `${base} bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100`, style: bgStyle };
          case 'app': return { className: `${base} bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100`, style: bgStyle };
          case 'source': return { className: `${base} bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100`, style: bgStyle };
          default: return { className: `${base} bg-white text-gray-700 border-gray-300 hover:bg-gray-50`, style: bgStyle };
      }
  };
  
  const renderCellContent = (lead: Lead, column: LeadTableColumn, index: number, isRotting: boolean) => {
    switch (column.key) {
        case 'id_serial': return <td className="p-3 whitespace-nowrap text-gray-600 font-mono text-xs">{index + 1}</td>;
        case 'createdAt': 
            const dateObj = new Date(lead.createdAt);
            return (
                <td className="p-3 whitespace-nowrap">
                    <div className="flex flex-col">
                        <span className="text-gray-700 font-medium">{dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className="text-[10px] text-gray-400">{dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </td>
            );
        case 'name': return (
            <td className="p-3 whitespace-nowrap relative">
                <div className="flex items-center">
                    {isRotting && (
                        <div className="group/rotting relative mr-2">
                            <i className="ri-error-warning-fill text-red-500 text-lg animate-pulse"></i>
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 w-max px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover/rotting:opacity-100 transition-opacity pointer-events-none z-10">
                                No activity for 3+ days
                            </div>
                        </div>
                    )}
                    <Link to={`/leads/${lead.id}`} className="font-medium text-blue-600 hover:underline flex items-center">
                        {lead.name}
                    </Link>
                </div>
            </td>
        );
        case 'notes': 
            const notesCount = lead.notesCount || 0;
            const latestNote = lead.latestNote || null;
            return (
                <td className="p-3 min-w-[220px]">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span 
                                title={latestNote ? `Latest: ${latestNote}` : 'No remarks'} 
                                className={`flex-shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full border ${notesCount > 0 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                            >
                                {notesCount}
                            </span>
                            <input
                                type="text"
                                value={quickNoteInputs[String(lead.id)] || ''}
                                onChange={(e) => handleQuickNoteChange(String(lead.id), e.target.value)}
                                onKeyDown={(e) => handleQuickNoteSubmit(String(lead.id), e)}
                                placeholder="Add remark & Enter..."
                                className="w-full text-xs border border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary rounded px-2 py-1.5 bg-white/50 focus:bg-white transition-all outline-none placeholder-gray-400"
                            />
                        </div>
                        {latestNote && (
                            <p className="text-[10px] text-gray-400 truncate max-w-[180px] pl-1" title={latestNote}>
                                <i className="ri-chat-1-line mr-1"></i>{latestNote}
                            </p>
                        )}
                    </div>
                </td>
            );

        case 'reminders': 
            return (
                <td className="p-3 whitespace-nowrap text-center">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${lead.remindersCount ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-400'}`}>
                        {lead.remindersCount || 0}
                    </span>
                </td>
            );
        
        case 'leadSource': 
            const sourceStyle = getSelectClass('source');
            return (
            <td className="p-3 min-w-[140px]">
                <select 
                    value={lead.leadSource} 
                    disabled={!canUpdateLeads} 
                    onChange={(e) => handleInlineUpdate(lead, 'leadSource', e.target.value)} 
                    className={sourceStyle.className}
                    style={sourceStyle.style}
                >
                    {leadSources.map(source => <option key={source.id} value={source.name}>{source.name}</option>)}
                </select>
            </td>
        );
        case 'assignedToId': return <td className="p-3 min-w-[160px]"><select value={lead.assignedToId || ''} disabled={!canUpdateLeads} onChange={(e) => handleInlineUpdate(lead, 'assignedToId', e.target.value)} className="w-full p-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-100 disabled:cursor-not-allowed"><option value="">Unassigned</option>{users.map(user => <option key={user.id} value={user.id}>{capitalizeName(user.name)}</option>)}</select></td>;
        
        case 'leadStatus': 
            const statusStyle = getSelectClass('status');
            return (
            <td className="p-3 min-w-[140px]">
                <select 
                    value={lead.leadStatus} 
                    disabled={!canUpdateLeads} 
                    onChange={(e) => handleInlineUpdate(lead, 'leadStatus', e.target.value)} 
                    className={statusStyle.className}
                    style={statusStyle.style}
                >
                    {leadStatuses.map(status => <option key={status.id} value={status.name}>{status.name}</option>)}
                </select>
            </td>
        );

        case 'applicationStatus': 
            const appStyle = getSelectClass('app');
            return (
                <td className="p-3 min-w-[150px]">
                    <select
                        value={lead.applicationStatus}
                        disabled={!canUpdateLeads}
                        onChange={(e) => handleInlineUpdate(lead, 'applicationStatus', e.target.value)}
                        className={appStyle.className}
                        style={appStyle.style}
                    >
                        {applicationStatuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                </td>
            );

        case 'passportStatus': 
             return (
                <td className="p-3 min-w-[150px]">
                    <select
                        value={lead.passportStatus}
                        disabled={!canUpdateLeads}
                        onChange={(e) => handleInlineUpdate(lead, 'passportStatus', e.target.value)}
                        className="w-full p-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-100"
                    >
                        {passportStatuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                </td>
            );

        case 'actions': return (
            <td className="p-3 whitespace-nowrap min-w-[100px]">
                <div className="flex items-center gap-1">
                    <Link to={`/leads/${lead.id}`} className="px-3 py-1 text-xs font-medium text-white bg-primary rounded-md hover:bg-primary/90">View</Link>
                    {canDeleteLeads && (
                        <button 
                            onClick={() => handleDelete(lead)} 
                            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete Lead"
                        >
                            <i className="ri-delete-bin-line text-base"></i>
                        </button>
                    )}
                </div>
            </td>
        );
        default: return <td className="p-3 whitespace-nowrap text-gray-600">{(lead as any)[column.key]}</td>;
    }
  };

  if (leads.length === 0) {
    return <div className="p-8 text-center text-gray-500">
        <i className="ri-folder-open-line text-4xl text-gray-300 mb-4"></i>
        <p>No leads found in this category.</p>
    </div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 sticky top-0 z-20 shadow-sm">
          <tr>
            <th className="p-3 w-4 bg-gray-50"><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.size > 0 && selectedIds.size === leads.length} /></th>
            {visibleColumns.map(col => {
              const isSortable = !['id_serial', 'notes', 'reminders', 'actions'].includes(col.key);
              return (
                <th 
                  key={col.key} 
                  className={`p-3 text-left font-semibold text-gray-600 whitespace-nowrap bg-gray-50 group ${isSortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                  onClick={() => isSortable && requestSort(col.key as keyof Lead)}
                >
                  <div className="flex items-center space-x-1">
                      <span>{col.label}</span>
                      {isSortable && (
                          sortConfig?.key === col.key ? (
                              <i className={`${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>
                          ) : (
                              <i className="text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>
                          )
                      )}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {leads.map((lead, index) => {
            const isRotting = isLeadRotting(lead);
            const rowClass = isRotting 
                ? 'bg-red-50/70 hover:bg-red-50' 
                : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50');
            
            return (
                <tr key={lead.id} className={rowClass}>
                <td className="p-3 w-4"><input type="checkbox" checked={selectedIds.has(String(lead.id))} onChange={() => handleSelectRow(String(lead.id))} /></td>
                {visibleColumns.map(col => (
                    <React.Fragment key={`${lead.id}-${col.key}`}>
                        {renderCellContent(lead, col, index, isRotting)}
                    </React.Fragment>
                ))}
                </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default LeadTable;
