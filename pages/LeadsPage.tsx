
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
import SearchableDropdown from '../components/common/SearchableDropdown';
import { capitalizeName } from '../utils/formatters';
import Tooltip from '../components/common/Tooltip';
import { getStatusVisual } from '../utils/statusColors';


import { allCountries } from '../utils/countries';

const LEAD_STATUS_TAB_ORDER = ['New Lead', 'Follow Up', 'Under Process', 'No Response', 'Won', 'Close'];
const LEADS_PAGE_SIZE_STORAGE_KEY = 'crm_leadsItemsPerPage';
const DEFAULT_LEADS_PAGE_SIZE = 100;

const normalizeLeadStatusName = (statusName: string) => (
    statusName
        .trim()
        .toLowerCase()
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
);

const LEAD_STATUS_CANONICAL_LABELS: Record<string, string> = {
    'new lead': 'New Lead',
    'follow up': 'Follow Up',
    'followup': 'Follow Up',
    'under process': 'Under Process',
    'underprocess': 'Under Process',
    'under processing': 'Under Process',
    'no response': 'No Response',
    'noresponse': 'No Response',
    'won': 'Won',
    'close': 'Close',
    'closed': 'Close',
    'lost': 'Close'
};

const getCanonicalLeadStatusLabel = (statusName: string) => {
    const normalizedStatusName = normalizeLeadStatusName(statusName);
    return LEAD_STATUS_CANONICAL_LABELS[normalizedStatusName] || statusName.trim();
};

const getLeadStatusTabOrder = (statusName: string) => {
    const canonicalStatusName = getCanonicalLeadStatusLabel(statusName).toLowerCase();
    const index = LEAD_STATUS_TAB_ORDER.findIndex(status => status.toLowerCase() === canonicalStatusName);
    return index === -1 ? LEAD_STATUS_TAB_ORDER.length : index;
};

const isExactCanonicalLeadStatus = (statusName: string) => {
    const trimmedStatusName = statusName.trim().toLowerCase();
    const canonicalStatusName = getCanonicalLeadStatusLabel(statusName).toLowerCase();
    return trimmedStatusName === canonicalStatusName;
};

const getLeadFilterDateOnly = (dateValue?: string | null) => {
    if (!dateValue) return '';
    const raw = String(dateValue).trim();

    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
        return raw.slice(0, 10);
    }

    if (/^\d{2}-\d{2}-\d{4}$/.test(raw) || /^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
        const [day, month, year] = raw.split(/[-/]/);
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return '';
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getInitialLeadsPageSize = () => {
    try {
        const stored = Number(localStorage.getItem(LEADS_PAGE_SIZE_STORAGE_KEY));
        return [10, 20, 50, 100].includes(stored) ? stored : DEFAULT_LEADS_PAGE_SIZE;
    } catch {
        return DEFAULT_LEADS_PAGE_SIZE;
    }
};

const ALL_LEAD_COLUMNS: LeadTableColumn[] = [
    { key: 'id_serial', label: 'ID' },
    { key: 'leadDate', label: 'Lead Date' },
    { key: 'createdAt', label: 'Created Date' },
    { key: 'name', label: 'First Name' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'email', label: 'Email' },
    { key: 'country', label: 'Country' },
    { key: 'leadCategory', label: 'Lead Category' },
    { key: 'leadType', label: 'Lead Type' },
    { key: 'service', label: 'Service' },
    { key: 'notes', label: 'Notes' },
    { key: 'leadStatus', label: 'Lead Status' },
    { key: 'reminders', label: 'Reminders' },
    { key: 'leadSource', label: 'Lead Source' },
    { key: 'assignedToId', label: 'Lead Assign' },
    // { key: 'applicationStatus', label: 'Application Status' },
    // { key: 'passportStatus', label: 'Passport Status' },
    { key: 'actions', label: 'Action' },
];

const DEFAULT_VISIBLE_COLUMNS: LeadTableColumn[] = [
    { key: 'id_serial', label: 'ID' },
    { key: 'leadDate', label: 'Lead Date' },
    { key: 'name', label: 'First Name' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'email', label: 'Email' },
    { key: 'country', label: 'Country' },
    { key: 'service', label: 'Service' },
    { key: 'notes', label: 'Notes' },
    { key: 'leadStatus', label: 'Lead Status' },
    { key: 'reminders', label: 'Reminders' },
    { key: 'leadSource', label: 'Lead Source' },
    { key: 'assignedToId', label: 'Lead Assign' },
    // { key: 'applicationStatus', label: 'Application Status' },
    { key: 'actions', label: 'Action' },
];

const getInitialVisibleColumns = (): LeadTableColumn[] => {
    try {
        const stored = localStorage.getItem('crm_visibleLeadColumns');
        if (stored) {
            const storedKeys = JSON.parse(stored) as string[];
            const migratedKeys = storedKeys.map(key => key === 'createdAt' ? 'leadDate' : key);
            const userVisible = ALL_LEAD_COLUMNS.filter(col => storedKeys.includes(col.key));
            const migratedVisible = ALL_LEAD_COLUMNS.filter(col => migratedKeys.includes(col.key));
            const essentialKeys = new Set(['id_serial', 'name', 'actions']);
            const finalColumns = [...(migratedVisible.length ? migratedVisible : userVisible)];
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
  const { leads, users, leadSources, leadStatuses, countries, bulkAssignLeads, bulkDeleteLeads, bulkUpdateLeadStatus, openLeadModal, currentUser } = useCrm();
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
  const [countryFilter, setCountryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  
  const [isColumnsModalOpen, setIsColumnsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [visibleColumns, setVisibleColumns] = useState<LeadTableColumn[]>(getInitialVisibleColumns);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSuperAdmin = currentUser && String(currentUser.role).toLowerCase() === 'super admin';

  const statusTabs = useMemo(() => {
    const baseTabs = [
      { key: 'All', name: 'All Leads', color: '#334155' },
      { key: 'Unassigned', name: 'Unassigned', color: '#ef4444' }
    ];
    const dynamicStatusTabs = [...leadStatuses]
      .map((status, originalIndex) => ({ status, originalIndex }))
      .sort((a, b) => {
        const aOrder = getLeadStatusTabOrder(a.status.name);
        const bOrder = getLeadStatusTabOrder(b.status.name);
        const bothAreCustom = aOrder === LEAD_STATUS_TAB_ORDER.length && bOrder === LEAD_STATUS_TAB_ORDER.length;
        if (bothAreCustom) return a.status.name.localeCompare(b.status.name);
        if (aOrder === bOrder) {
          const exactDiff = Number(isExactCanonicalLeadStatus(b.status.name)) - Number(isExactCanonicalLeadStatus(a.status.name));
          return exactDiff || a.originalIndex - b.originalIndex;
        }
        return aOrder - bOrder;
      })
      .filter(({ status }, index, sortedStatuses) => {
        const canonicalLabel = getCanonicalLeadStatusLabel(status.name).toLowerCase();
        return sortedStatuses.findIndex(item => getCanonicalLeadStatusLabel(item.status.name).toLowerCase() === canonicalLabel) === index;
      })
      .map(({ status }) => {
        const canonicalLabel = getCanonicalLeadStatusLabel(status.name);
        return {
          key: status.name,
          name: canonicalLabel,
          color: status.color || '#2563eb'
        };
      });
    return [...baseTabs, ...dynamicStatusTabs];
  }, [leadStatuses]);

  const activeStatus = searchParams.get('status') || statusTabs[0].key;
  const isUnassignedLead = (lead: Lead) => {
    const assignedValue = String(lead.assignedToId ?? '').trim().toLowerCase();
    return !assignedValue || assignedValue === '0' || assignedValue === 'null' || assignedValue === 'undefined';
  };

  const countriesForFilter = useMemo(() => {
    return Array.from(
      new Set(
        (countries.length ? countries : allCountries)
          .map(c => (c.name || '').trim())
          .filter(Boolean)
      )
    ).sort();
  }, [countries]);

  const countryFilterOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All Countries' },
      ...countriesForFilter.map(country => ({ value: country, label: country }))
    ];
  }, [countriesForFilter]);

  const filteredLeads = useMemo(() => {
    let leadsToFilter = leads;

    if (view === 'table') {
      if (activeStatus === 'Unassigned') {
        leadsToFilter = leadsToFilter.filter(isUnassignedLead);
      } else if (activeStatus !== 'All') {
        leadsToFilter = leadsToFilter.filter(lead => lead.leadStatus === activeStatus);
      }
    }
    
    return leadsToFilter.filter(lead => {
      const leadDate = getLeadFilterDateOnly(lead.leadDate || lead.createdAt);
      return (
        (
          agentFilter === 'all' ||
          (agentFilter === 'assigned' ? !isUnassignedLead(lead) :
            (agentFilter === 'unassigned' ? isUnassignedLead(lead) : String(lead.assignedToId) === agentFilter))
        ) &&
        (sourceFilter === 'all' || lead.leadSource === sourceFilter) &&
        (countryFilter === 'all' || lead.country === countryFilter) &&
        (!dateFilter || leadDate === dateFilter) &&
        (
          lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          lead.phone.includes(searchTerm) ||
          (lead.service && lead.service.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (lead.leadType && lead.leadType.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    });
  }, [leads, activeStatus, searchTerm, view, agentFilter, sourceFilter, countryFilter, dateFilter]);
  
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
  } = usePagination(sortedLeads, getInitialLeadsPageSize());

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

  const handleItemsPerPageChange = (size: number) => {
      setItemsPerPage(size);
      setCurrentPage(1);
      localStorage.setItem(LEADS_PAGE_SIZE_STORAGE_KEY, String(size));
  };

  const handleExport = () => {
    fireToast('info', 'Starting export...');
    const toExcelText = (value: string) => `="${String(value).replace(/"/g, '""')}"`;
    const toCsvCell = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };
    
    const exportColumns = visibleColumns.filter(c => c.key !== 'actions');
    const headers = exportColumns.map(c => c.label).join(',');
    
    const rows = sortedLeads.map(lead => {
        return exportColumns.map(col => {
            let val = '';
            if (col.key === 'id_serial') val = String(lead.id);
            else if (col.key === 'assignedToId') val = users.find(u => String(u.id) === String(lead.assignedToId))?.name || 'Unassigned';
            else val = (lead as any)[col.key] || '';

            const stringVal = String(val ?? '');
            if (col.key === 'leadDate') {
                const dateOnly = String(lead.leadDate || lead.createdAt || '').slice(0, 10);
                return dateOnly ? toCsvCell(toExcelText(dateOnly)) : '';
            }
            if (col.key === 'createdAt') {
                const dateOnly = stringVal ? stringVal.slice(0, 10) : '';
                return dateOnly ? toCsvCell(toExcelText(dateOnly)) : '';
            }
            if (col.key === 'phone' || col.key === 'phone2' || col.key === 'phone3' || col.key === 'phone4') {
                return stringVal ? toCsvCell(toExcelText(stringVal)) : '';
            }
            return toCsvCell(stringVal);
        }).join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent('\uFEFF' + [headers, ...rows].join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsActionsMenuOpen(false);
  };

  const handleBulkAssign = async () => {
    if (bulkAssignUser && selectedIds.size > 0 && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await bulkAssignLeads(Array.from(selectedIds), bulkAssignUser);
        fireToast('success', `${selectedIds.size} lead(s) assigned.`);
        setSelectedIds(new Set());
        setBulkAssignUser('');
      } catch (error: any) {
        fireToast('error', error.message || 'Failed to assign selected leads.');
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  const handleBulkStatusChange = async () => {
    if (bulkStatus && selectedIds.size > 0 && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await bulkUpdateLeadStatus(Array.from(selectedIds), bulkStatus);
        fireToast('success', `${selectedIds.size} lead(s) status updated.`);
        setSelectedIds(new Set());
        setBulkStatus('');
      } catch (error: any) {
        fireToast('error', error.message || 'Failed to update selected leads.');
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size > 0 && !isSubmitting) {
        const result = await confirmDelete({
            title: `Delete ${selectedIds.size} Lead(s)?`,
            html: `You are about to delete ${selectedIds.size} selected lead(s). This action cannot be undone.`,
        });

        if (result) {
            setIsSubmitting(true);
            try {
              await bulkDeleteLeads(Array.from(selectedIds));
              setSelectedIds(new Set());
              fireToast('success', `${selectedIds.size} lead(s) deleted successfully.`);
            } catch (error: any) {
              fireToast('error', error.message || 'Failed to delete selected leads.');
            } finally {
              setIsSubmitting(false);
            }
        }
    }
  }

  const tabClass = (status: string) => {
    const isActive = activeStatus === status;
    return `whitespace-nowrap pb-2 px-2 border-b-2 font-bold text-xs sm:text-sm transition-colors duration-200 rounded-t-md ${
      isActive
        ? ''
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;
  };

  const selectedBulkStatusVisual = useMemo(() => {
    const selectedStatus = leadStatuses.find(status => status.name === bulkStatus);
    return getStatusVisual(selectedStatus?.color);
  }, [leadStatuses, bulkStatus]);
    
  return (
    <>
    <div className="flex flex-col h-full min-h-0 overflow-y-auto xl:overflow-hidden">
      <div className="p-2 sm:p-3 lg:p-4 pb-0 flex-none space-y-2 bg-gray-50 min-w-0">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-between items-stretch sm:items-center">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Leads <span className="text-gray-400 font-medium text-base sm:text-lg">({totalItems})</span></h2>
              {permissions.can('leads', 'create') && (
                  <button onClick={() => openLeadModal(null)} className="w-full sm:w-auto justify-center px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 flex items-center shadow-sm transition-all hover:shadow-md">
                      <i className="ri-add-line mr-2"></i>
                      Create Lead
                  </button>
              )}
          </div>

          <div className="bg-white p-2 sm:p-3 rounded-lg shadow-sm border border-gray-200 min-w-0">
             {view === 'table' && (
                <div className="border-b border-gray-200 mb-2 overflow-x-auto lead-tabs-scroll">
                    <nav className="-mb-px flex w-max min-w-full gap-x-1.5 sm:gap-x-3">
                        {statusTabs.map(tab => {
                          const visual = getStatusVisual(tab.color);
                          const count = tab.key === 'All'
                            ? leads.length
                            : tab.key === 'Unassigned'
                              ? leads.filter(isUnassignedLead).length
                              : leads.filter(lead => lead.leadStatus === tab.key).length;
                          const isActiveTab = activeStatus === tab.key;
                          return (
                          <button
                            key={tab.key}
                            onClick={() => setSearchParams({ status: tab.key })}
                            className={tabClass(tab.key)}
                            style={isActiveTab ? {
                              color: visual.color,
                              borderColor: visual.color,
                              backgroundColor: visual.backgroundColor
                            } : undefined}
                          >
                            <span className="inline-flex items-center gap-1.5 sm:gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: visual.color }}></span>
                              {tab.name}
                              <span
                                className="px-1.5 py-0.5 rounded-full text-[10px] border"
                                style={{
                                  color: isActiveTab ? visual.color : '#64748b',
                                  borderColor: isActiveTab ? visual.borderColor : '#e5e7eb',
                                  backgroundColor: isActiveTab ? visual.strongBackgroundColor : '#f8fafc'
                                }}
                              >
                                {count}
                              </span>
                            </span>
                          </button>
                          );
                        })}
                    </nav>
                </div>
            )}

            <div className="flex flex-col 2xl:flex-row gap-2 lg:gap-3 justify-between items-stretch 2xl:items-center min-w-0">
                <div className="flex-grow flex flex-col lg:flex-row gap-2 w-full 2xl:w-auto min-w-0">
                    <SearchInput
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name, phone, service or email..."
                        className="w-full lg:w-64 flex-shrink-0"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 w-full min-w-0">
                        {isSuperAdmin && (
                            <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className="filter-dropdown w-full">
                                <option value="all">All Leads</option>
                                <option value="assigned">Assigned</option>
                                <option value="unassigned">Unassigned</option>
                                {users.map(user => (
                                    <option key={user.id} value={String(user.id)}>{capitalizeName(user.name)}</option>
                                ))}
                            </select>
                        )}
                        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="filter-dropdown w-full">
                            <option value="all">All Sources</option>
                            {leadSources.map(source => (
                                <option key={source.id} value={source.name}>{source.name}</option>
                            ))}
                        </select>
                        <div className="w-full h-[38px] min-w-0">
                            <SearchableDropdown
                                options={countryFilterOptions}
                                value={countryFilter}
                                onChange={setCountryFilter}
                                placeholder="All Countries"
                                buttonClassName="filter-dropdown no-native-arrow w-full"
                            />
                        </div>
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="filter-dropdown w-full"
                            title="Filter by lead date"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:flex sm:flex-wrap 2xl:flex-nowrap items-stretch sm:items-center gap-2 w-full 2xl:w-auto justify-start 2xl:justify-end">
                    <div className="p-1 bg-gray-100 rounded-md flex items-center justify-center sm:justify-start mr-0 sm:mr-1">
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
                                className="w-full sm:w-auto justify-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 hover:text-primary transition-all flex items-center shadow-sm"
                            >
                                <i className="ri-upload-cloud-2-line text-lg mr-2 text-blue-500"></i>
                                <span>Import</span>
                            </button>
                        </Tooltip>
                    )}

                    <Tooltip content="Export Leads to CSV">
                        <button 
                            onClick={handleExport} 
                            className="w-full sm:w-auto justify-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 hover:text-primary transition-all flex items-center shadow-sm"
                        >
                            <i className="ri-download-cloud-2-line text-lg mr-2 text-green-500"></i>
                            <span className="hidden sm:inline">Export</span>
                        </button>
                    </Tooltip>

                    <Tooltip content="Manage Columns">
                        <button 
                            onClick={() => setIsColumnsModalOpen(true)} 
                            className="w-full sm:w-auto justify-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center shadow-sm"
                        >
                            <i className="ri-layout-column-line text-lg"></i>
                        </button>
                    </Tooltip>

                    <div className="relative min-w-0" ref={actionsMenuRef}>
                        <Tooltip content="More Actions">
                            <button onClick={() => setIsActionsMenuOpen(p => !p)} className="w-full sm:w-auto justify-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center shadow-sm">
                                <i className="ri-more-fill text-lg"></i>
                            </button>
                        </Tooltip>
                         {isActionsMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 max-w-[calc(100vw-2rem)] bg-white rounded-md shadow-lg py-1 z-30 border border-gray-100 transform origin-top-right">
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
              <div className="p-2 sm:p-3 bg-indigo-50 rounded-md border border-indigo-200 flex flex-col lg:flex-row lg:flex-wrap items-stretch lg:items-center gap-2 sm:gap-3 animate-fade-in-up shadow-sm min-w-0">
                <span className="text-sm font-bold text-indigo-700 bg-white px-2 py-1 rounded border border-indigo-200 shadow-sm">{selectedIds.size} Selected</span>
                <div className="hidden lg:block h-6 w-px bg-indigo-200 mx-2"></div>
                
                {permissions.can('leads', 'update') && (
                  <>
                    {isSuperAdmin && (
                        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] items-center gap-2 w-full lg:w-auto">
                            <select 
                            value={bulkAssignUser}
                            onChange={(e) => setBulkAssignUser(e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white shadow-sm min-w-0"
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

                    <div className="hidden lg:block h-6 w-px bg-indigo-200 mx-2"></div>

                    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] items-center gap-2 w-full lg:w-auto">
                        <select 
                            value={bulkStatus}
                            onChange={(e) => setBulkStatus(e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white shadow-sm"
                            style={bulkStatus ? {
                                color: selectedBulkStatusVisual.color,
                                borderColor: selectedBulkStatusVisual.borderColor,
                                backgroundColor: selectedBulkStatusVisual.backgroundColor
                            } : undefined}
                        >
                            <option value="">Change Status...</option>
                            {leadStatuses.map(status => (
                                <option key={status.id} value={status.name}>{status.name}</option>
                            ))}
                        </select>
                        <button 
                            onClick={handleBulkStatusChange}
                            disabled={!bulkStatus}
                            className="px-3 py-1.5 text-sm font-medium text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm transition-colors"
                            style={bulkStatus ? { backgroundColor: selectedBulkStatusVisual.color } : undefined}
                        >
                            Update
                        </button>
                    </div>
                  </>
                )}
                
                <div className="hidden lg:block flex-grow"></div>

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

      <div className="flex-1 min-h-[420px] xl:min-h-0 overflow-hidden p-2 sm:p-3 lg:p-4 pt-2">
          {view === 'table' ? (
            <div className="h-full min-h-0 flex flex-col bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
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
                onItemsPerPageChange={handleItemsPerPageChange}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
              />
            </div>
          ) : (
            <div className="h-full min-h-0 overflow-hidden">
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
       .no-native-arrow {
         background-image: none !important;
       }
       .lead-tabs-scroll {
         -webkit-overflow-scrolling: touch;
         scrollbar-width: thin;
       }
       .lead-tabs-scroll::-webkit-scrollbar {
         height: 4px;
       }
       .lead-tabs-scroll::-webkit-scrollbar-thumb {
         background: #cbd5e1;
         border-radius: 999px;
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
