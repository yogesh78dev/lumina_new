import React, { useMemo, useState } from 'react';
import { useCrm } from '../hooks/useCrm';
// FIX: Added LeadTableColumn to imports to support visible columns.
import { Lead, User, LeadTableColumn } from '../types';
import LeadTable from '../components/leads/LeadTable';
import { useSwal } from '../hooks/useSwal';
import { useSorting } from '../hooks/useSorting';

// FIX: Added column definitions to be used by the LeadTable.
const ALL_LEAD_COLUMNS: LeadTableColumn[] = [
    { key: 'id_serial', label: 'ID' },
    { key: 'createdAt', label: 'Date' },
    { key: 'name', label: 'First Name' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'email', label: 'Email' },
    { key: 'service', label: 'Service' },
    { key: 'country', label: 'Country' },
    { key: 'companyName', label: 'Company Name' },
    { key: 'location', label: 'Location' },
    { key: 'notes', label: 'Notes' },
    { key: 'reminders', label: 'Reminders' },
    { key: 'leadSource', label: 'Lead Source' },
    { key: 'assignedToId', label: 'Lead Assign' },
    { key: 'leadStatus', label: 'Lead Status' },
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
    { key: 'leadStatus', label: 'Lead Status' },
    { key: 'actions', label: 'Action' },
];

const getInitialVisibleColumns = (): LeadTableColumn[] => {
    try {
        const stored = localStorage.getItem('crm_visibleLeadColumns');
        if (stored) {
            const storedKeys = JSON.parse(stored) as string[];
            // Filter ALL_LEAD_COLUMNS to ensure we only use valid, up-to-date columns
            return ALL_LEAD_COLUMNS.filter(col => storedKeys.includes(col.key));
        }
    } catch (error) {
        console.error("Failed to parse visible columns from localStorage", error);
    }
    return DEFAULT_VISIBLE_COLUMNS;
};


const FollowUpPage: React.FC = () => {
  const { leads, users, openLeadModal, bulkAssignLeads, bulkDeleteLeads } = useCrm();
  const { confirmDelete, fireToast } = useSwal();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAssignUser, setBulkAssignUser] = useState<string>('');
  // FIX: Added state for visible columns.
  const [visibleColumns] = useState<LeadTableColumn[]>(getInitialVisibleColumns);

  const followUpLeads = useMemo(() => {
    return leads
      .filter(lead => lead.leadStatus === 'Follow-up')
      .filter(lead => lead.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [leads, searchTerm]);
  
  // FIX: Implement sorting for the table data.
  const { items: sortedLeads, requestSort, sortConfig } = useSorting<Lead>(followUpLeads);

  const handleBulkAssign = () => {
    if (bulkAssignUser && selectedIds.size > 0) {
      bulkAssignLeads(Array.from(selectedIds), bulkAssignUser);
      setSelectedIds(new Set());
      setBulkAssignUser('');
    }
  }
  
  const handleBulkDelete = async () => {
    if (selectedIds.size > 0) {
      const result = await confirmDelete({
          title: `Delete ${selectedIds.size} Lead(s)`,
          html: `Are you sure you want to delete ${selectedIds.size} selected lead(s)? This action cannot be undone.`,
      });
      
      if (result) {
          bulkDeleteLeads(Array.from(selectedIds));
          setSelectedIds(new Set());
          fireToast('success', `${selectedIds.size} lead(s) deleted successfully.`);
      }
    }
  }

  const pageTitle = "Leads for Follow Up";

  return (
    <div className="container mx-auto">
      <header className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <i className="fa-solid fa-filter text-gray-500 mr-3"></i>
              {pageTitle}
            </h2>
            <div className="flex items-center space-x-2">
                <input
                    type="text"
                    placeholder="Search User..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                 <select className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="400">400</option>
                    <option value="100">100</option>
                    <option value="50">50</option>
                 </select>
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                    <i className="fa-solid fa-file-export mr-2"></i>
                    Export
                </button>
                <button onClick={() => openLeadModal(null)} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90">
                    Create
                </button>
            </div>
        </div>
        {selectedIds.size > 0 && (
          <div className="mt-4 p-3 bg-primary/10 rounded-md border border-primary/20 flex items-center space-x-3">
              <span className="text-sm font-medium text-primary">{selectedIds.size} selected</span>
              <select 
                value={bulkAssignUser}
                onChange={(e) => setBulkAssignUser(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                  <option value="">Assign to...</option>
                  {users.map((user: User) => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
              </select>
              <button 
                onClick={handleBulkAssign}
                disabled={!bulkAssignUser}
                className="px-4 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:bg-gray-400"
              >
                Assign
              </button>
              <button 
                onClick={handleBulkDelete}
                className="px-4 py-1.5 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-black"
              >
                Delete
              </button>
          </div>
        )}
      </header>
      {/* FIX: Pass sorting props to LeadTable to resolve component contract violation. */}
      <LeadTable leads={sortedLeads} visibleColumns={visibleColumns} selectedIds={selectedIds} setSelectedIds={setSelectedIds} requestSort={requestSort} sortConfig={sortConfig} />
    </div>
  );
};

export default FollowUpPage;