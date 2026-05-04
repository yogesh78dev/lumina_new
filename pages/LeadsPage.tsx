
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCrm } from '../hooks/useCrm';
import { usePermissions } from '../hooks/usePermissions';
import { useSwal } from '../hooks/useSwal';
import { User, LeadTableColumn, Lead } from '../types';
import LeadTable from '../components/leads/LeadTable';
import LeadKanbanView from '../components/leads/LeadKanbanView';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/common/Pagination';
import ManageColumnsModal from '../components/leads/ManageColumnsModal';
import { useSorting } from '../hooks/useSorting';
import ImportLeadsModal from '../components/leads/ImportLeadsModal';
import ImportHistoryModal from '../components/leads/ImportHistoryModal';
import SearchInput from '../components/common/SearchInput';
import { capitalizeName } from '../utils/formatters';
import Tooltip from '../components/common/Tooltip';


const TABS = [
  { key: 'All', name: 'All Leads' },
  { key: 'New Lead', name: 'New' },
  { key: 'Follow-up', name: 'Follow Up' },
  { key: 'Won', name: 'Won' },
  { key: 'Lost', name: 'Lost' }
];

const ALL_LEAD_COLUMNS: LeadTableColumn[] = [
    { key: 'id_serial', label: 'ID' },
    { key: 'createdAt', label: 'Date' },
    { key: 'name', label: 'First Name' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'email', label: 'Email' },
    { key: 'service', label: 'Service' },
    { key: 'notes', label: 'Notes' },
    { key: 'reminders', label: 'Reminders' },
    { key: 'leadSource', label: 'Lead Source' },
    { key: 'assignedToId', label: 'Lead Assign' },
    { key: 'leadStatus', label: 'Pipeline Status' },
    { key: 'applicationStatus', label: 'Application Status' },
    { key: 'passportStatus', label: 'Passport Status' },
    { key: 'actions', label: 'Action' },
];

const DEFAULT_VISIBLE_COLUMNS: LeadTableColumn[] = [
    { key: 'id_serial', label: 'ID' },
    { key: 'createdAt', label: 'Date' },
    { key: 'name', label: 'First Name' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'email', label: 'Email' },
    { key: 'service', label: 'Service' },
    { key: 'notes', label: 'Notes' },
    { key: 'reminders', label: 'Reminders' },
    { key: 'leadSource', label: 'Lead Source' },
    { key: 'assignedToId', label: 'Lead Assign' },
    { key: 'leadStatus', label: 'Pipeline Status' },
    { key: 'applicationStatus', label: 'Application Status' },
    { key: 'actions', label: 'Action' },
];

const getInitialVisibleColumns = (): LeadTableColumn[] => {
    try {
        const stored = localStorage.getItem('crm_visibleLeadColumns');
        if (stored) {
            const storedKeys = JSON.parse(stored) as string[];
            const userVisible = ALL_LEAD_COLUMNS.filter(col => storedKeys.includes(col.key));
            const essentialKeys = new Set(['id_serial', 'name', 'actions']);
            const finalColumns = [...userVisible];
            DEFAULT_VISIBLE_COLUMNS.forEach(defaultCol => {
                if(essentialKeys.has(defaultCol.key) && !finalColumns.find(c => c.key === defaultCol.key)) {
                    finalColumns.push(defaultCol);
                }
            });
            return finalColumns;
        }
    } catch (error) {
        console.error("Failed to parse visible columns from localStorage", error);
    }
    return DEFAULT_VISIBLE_COLUMNS;
};


const LeadsPage: React.FC = () => {
  const { leads, users, leadSources, leadStatuses, bulkAssignLeads, bulkDeleteLeads, bulkUpdateLeadStatus, openLeadModal, currentUser } = useCrm();
  const permissions = usePermissions();
  const { confirmDelete, fireToast } = useSwal();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [bulkAssignUser, setBulkAssignUser] = useState<string>('');
  const [bulkStatus, setBulkStatus] = useState<string>('');

  const [view, setView] = useState<'table' | 'kanban'>('table');

  const [agentFilter, setAgentFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  
  const [isColumnsModalOpen, setIsColumnsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [visibleColumns, setVisibleColumns] = useState<LeadTableColumn[]>(getInitialVisibleColumns);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  
  const isAdminOrSuperAdmin = currentUser && ['Admin', 'Super Admin', 'Manager'].includes(currentUser.role);

  const activeStatus = searchParams.get('status') || TABS[0].key;

  const filteredLeads = useMemo(() => {
    let leadsToFilter = leads;

    if (view === 'table') {
      if (activeStatus !== 'All') {
        leadsToFilter = leadsToFilter.filter(lead => lead.leadStatus === activeStatus);
      }
    }
    
    return leadsToFilter.filter(lead => 
      (agentFilter === 'all' || String(lead.assignedToId) === agentFilter) &&
      (sourceFilter === 'all' || lead.leadSource === sourceFilter) &&
      (
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        lead.phone.includes(searchTerm) ||
        (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    );
  }, [leads, activeStatus, searchTerm, view, agentFilter, sourceFilter]);
  
  const { items: sortedLeads, requestSort, sortConfig } = useSorting<Lead>(filteredLeads, { key: 'createdAt', direction: 'descending'});

  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
    startIndex,
    endIndex,
    totalItems
  } = usePagination(sortedLeads, 10);

  useEffect(() => {
    if (view === 'kanban') {
      setSelectedIds(new Set());
      return;
    }
    const currentIdsOnPage = new Set(paginatedData.map((l: Lead) => String(l.id)));
    setSelectedIds(prevSelected => {
      const newSelected = new Set<string>();
      prevSelected.forEach(id => {
        if (currentIdsOnPage.has(id)) {
          newSelected.add(id);
        }
      });
      return newSelected;
    });
  }, [paginatedData, view]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setIsActionsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleSaveVisibleColumns = (newVisibleColumns: LeadTableColumn[]) => {
      setVisibleColumns(newVisibleColumns);
      const columnKeys = newVisibleColumns.map(col => col.key);
      localStorage.setItem('crm_visibleLeadColumns', JSON.stringify(columnKeys));
      setIsColumnsModalOpen(false);
  };

  const handleExport = () => {
    fireToast('info', 'Starting export...');
    
    const exportColumns = visibleColumns.filter(c => c.key !== 'actions');
    const headers = exportColumns.map(c => c.label).join(',');
    
    const rows = sortedLeads.map(lead => {
        return exportColumns.map(col => {
            let val = '';
            if (col.key === 'id_serial') val = String(lead.id);
            else if (col.key === 'assignedToId') val = users.find(u => String(u.id) === String(lead.assignedToId))?.name || 'Unassigned';
            else val = (lead as any)[col.key] || '';

            const stringVal = String(val);
            if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
                return `"${stringVal.replace(/"/g, '""')}"`;
            }
            return stringVal;
        }).join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent([headers, ...rows].join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsActionsMenuOpen(false);
  };

  const handleBulkAssign = () => {
    if (bulkAssignUser && selectedIds.size > 0) {
      bulkAssignLeads(Array.from(selectedIds), bulkAssignUser);
      fireToast('success', `${selectedIds.size} lead(s) assigned.`);
      setSelectedIds(new Set());
      setBulkAssignUser('');
    }
  }

  const handleBulkStatusChange = () => {
    if (bulkStatus && selectedIds.size > 0) {
      bulkUpdateLeadStatus(Array.from(selectedIds), bulkStatus);
      fireToast('success', `${selectedIds.size} lead(s) status updated.`);
      setSelectedIds(new Set());
      setBulkStatus('');
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size > 0) {
        const result = await confirmDelete({
            title: `Delete ${selectedIds.size} Lead(s)?`,
            html: `You are about to delete ${selectedIds.size} selected lead(s). This action cannot be undone.`,
        });

        if (result) {
            bulkDeleteLeads(Array.from(selectedIds));
            setSelectedIds(new Set());
            fireToast('success', `${selectedIds.size} lead(s) deleted successfully.`);
        }
    }
  }

  const tabClass = (status: string) => {
    const isActive = activeStatus === status;
    return `whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
      isActive
        ? 'border-primary text-primary'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;
  };
    
  return (
    <>
    <div className="flex flex-col h-full">
      <div className="p-4 sm:p-6 pb-0 flex-none space-y-4 bg-gray-50">
          <div className="flex flex-wrap gap-4 justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-800">Leads <span className="text-gray-400 font-medium text-xl">({totalItems})</span></h2>
              {permissions.can('leads', 'create') && (
                  <button onClick={() => openLeadModal(null)} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 flex items-center shadow-sm transition-all hover:shadow-md">
                      <i className="ri-add-line mr-2"></i>
                      Create Lead
                  </button>
              )}
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
             {view === 'table' && (
                <div className="border-b border-gray-200 mb-4">
                    <nav className="-mb-px flex flex-wrap gap-x-6 gap-y-2">
                        {TABS.map(tab => (
                          <button key={tab.key} onClick={() => setSearchParams({ status: tab.key })} className={tabClass(tab.key)}>
                            {tab.name}
                          </button>
                        ))}
                    </nav>
                </div>
            )}

            <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                <div className="flex-grow flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                    <SearchInput
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name, phone or email..."
                        className="w-full sm:w-64"
                    />
                    <div className="flex gap-2">
                        {isAdminOrSuperAdmin && (
                            <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className="filter-dropdown w-full sm:w-40">
                                <option value="all">All Agents</option>
                                {users.map(user => (
                                    <option key={user.id} value={String(user.id)}>{capitalizeName(user.name)}</option>
                                ))}
                            </select>
                        )}
                        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="filter-dropdown w-full sm:w-40">
                            <option value="all">All Sources</option>
                            {leadSources.map(source => (
                                <option key={source.id} value={source.name}>{source.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full xl:w-auto justify-end">
                    <div className="p-1 bg-gray-100 rounded-md flex items-center mr-1">
                        <Tooltip content="Table View">
                            <button onClick={() => setView('table')} className={`p-1.5 rounded transition-all ${view === 'table' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><i className="ri-list-check text-lg"></i></button>
                        </Tooltip>
                        <Tooltip content="Kanban View">
                            <button onClick={() => setView('kanban')} className={`p-1.5 rounded transition-all ${view === 'kanban' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><i className="ri-layout-grid-line text-lg"></i></button>
                        </Tooltip>
                    </div>

                    <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block"></div>

                    {permissions.can('leads', 'create') && (
                        <Tooltip content="Import Leads from CSV">
                            <button 
                                onClick={() => setIsImportModalOpen(true)} 
                                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 hover:text-primary transition-all flex items-center shadow-sm"
                            >
                                <i className="ri-upload-cloud-2-line text-lg mr-2 text-blue-500"></i>
                                <span>Import</span>
                            </button>
                        </Tooltip>
                    )}

                    <Tooltip content="Export Leads to CSV">
                        <button 
                            onClick={handleExport} 
                            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 hover:text-primary transition-all flex items-center shadow-sm"
                        >
                            <i className="ri-download-cloud-2-line text-lg mr-2 text-green-500"></i>
                            <span className="hidden sm:inline">Export</span>
                        </button>
                    </Tooltip>

                    <Tooltip content="Manage Columns">
                        <button 
                            onClick={() => setIsColumnsModalOpen(true)} 
                            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center shadow-sm"
                        >
                            <i className="ri-layout-column-line text-lg"></i>
                        </button>
                    </Tooltip>

                    <div className="relative" ref={actionsMenuRef}>
                        <Tooltip content="More Actions">
                            <button onClick={() => setIsActionsMenuOpen(p => !p)} className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center shadow-sm">
                                <i className="ri-more-fill text-lg"></i>
                            </button>
                        </Tooltip>
                         {isActionsMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-100 transform origin-top-right">
                                <button onClick={() => { setIsHistoryModalOpen(true); setIsActionsMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
                                    <i className="ri-history-line mr-2 text-gray-400"></i>Import History
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
          </div>

          {view === 'table' && selectedIds.size > 0 && (
              <div className="p-3 bg-indigo-50 rounded-md border border-indigo-200 flex flex-wrap items-center gap-3 animate-fade-in-up shadow-sm">
                <span className="text-sm font-bold text-indigo-700 bg-white px-2 py-1 rounded border border-indigo-200 shadow-sm">{selectedIds.size} Selected</span>
                <div className="h-6 w-px bg-indigo-200 mx-2"></div>
                
                {permissions.can('leads', 'update') && (
                  <>
                    {isAdminOrSuperAdmin && (
                        <div className="flex items-center gap-2">
                            <select 
                            value={bulkAssignUser}
                            onChange={(e) => setBulkAssignUser(e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white shadow-sm"
                            >
                            <option value="">Assign Agent...</option>
                            {users.map((user: User) => (
                                <option key={user.id} value={String(user.id)}>{user.name}</option>
                            ))}
                            </select>
                            <button 
                            onClick={handleBulkAssign}
                            disabled={!bulkAssignUser}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm transition-colors"
                            >
                            Apply
                            </button>
                        </div>
                    )}

                    <div className="h-6 w-px bg-indigo-200 mx-2"></div>

                    <div className="flex items-center gap-2">
                        <select 
                            value={bulkStatus}
                            onChange={(e) => setBulkStatus(e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white shadow-sm"
                        >
                            <option value="">Change Status...</option>
                            {leadStatuses.map(status => (
                                <option key={status.id} value={status.name}>{status.name}</option>
                            ))}
                        </select>
                        <button 
                            onClick={handleBulkStatusChange}
                            disabled={!bulkStatus}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm transition-colors"
                        >
                            Update
                        </button>
                    </div>
                  </>
                )}
                
                <div className="flex-grow"></div>

                {permissions.can('leads', 'delete') && (
                  <button 
                    onClick={handleBulkDelete}
                    className="px-4 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-md hover:bg-red-50 shadow-sm transition-colors"
                  >
                    <i className="ri-delete-bin-line mr-1"></i> Delete
                  </button>
                )}
              </div>
          )}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden p-4 sm:p-6 pt-2">
          {view === 'table' ? (
            <div className="h-full flex flex-col bg-white rounded-lg shadow-md border border-gray-200">
                <div className="flex-1 overflow-auto rounded-t-lg relative">
                  <LeadTable 
                    leads={paginatedData as Lead[]} 
                    visibleColumns={visibleColumns} 
                    selectedIds={selectedIds} 
                    setSelectedIds={setSelectedIds}
                    requestSort={requestSort}
                    sortConfig={sortConfig}
                  />
                </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
              />
            </div>
          ) : (
            <div className="h-full overflow-hidden">
                <LeadKanbanView leads={filteredLeads} />
            </div>
          )}
      </div>
    </div>

    <ManageColumnsModal
        isOpen={isColumnsModalOpen}
        onClose={() => setIsColumnsModalOpen(false)}
        allColumns={ALL_LEAD_COLUMNS}
        visibleColumns={visibleColumns}
        onSave={handleSaveVisibleColumns}
    />
    <ImportLeadsModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
    />
    <ImportHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
    />
    <style>{`
      .filter-dropdown {
        background-color: white;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        padding: 0.5rem 2rem 0.5rem 0.75rem;
        font-size: 0.875rem;
        line-height: 1.25rem;
        color: #374151;
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
        background-position: right 0.5rem center;
        background-repeat: no-repeat;
        background-size: 1.5em 1.5em;
      }
       .filter-dropdown:focus {
          outline: 1px solid transparent;
          border-color: #c4161c;
          box-shadow: 0 0 0 1px #c4161c;
       }
       @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fadeInUp 0.3s ease-out forwards;
        }
    `}</style>
    </>
  );
};

export default LeadsPage;
