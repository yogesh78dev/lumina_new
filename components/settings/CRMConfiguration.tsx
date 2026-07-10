
import React, { useState, useMemo, useEffect } from 'react';
import { useCrm } from '../../hooks/useCrm';
import { useSwal } from '../../hooks/useSwal';
import { useSorting } from '../../hooks/useSorting';
import SearchInput from '../common/SearchInput';
import Tooltip from '../common/Tooltip';

interface StatusItem {
    // FIX: Allow id to be string or number to accommodate various CRM data types
    id: string | number;
    name: string;
    isoCode?: string;
    phoneCode?: string;
    color?: string;
    progress?: number;
}

interface StatusManagerProps {
    title: string;
    items: StatusItem[];
    onAdd: (data: any) => Promise<void> | void;
    onUpdate: (item: StatusItem) => Promise<void> | void;
    // FIX: Match signature to allow string or number id
    onDelete: (id: string | number) => Promise<void> | void;
    enableColorProgress?: boolean;
}

const StatusManager: React.FC<StatusManagerProps> = ({ title, items, onAdd, onUpdate, onDelete, enableColorProgress = false }) => {
    const { fireToast, confirmDelete } = useSwal();
    const [name, setName] = useState('');
    const [color, setColor] = useState('#2563eb');
    const [progress, setProgress] = useState('0');
    const [editingItem, setEditingItem] = useState<StatusItem | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const isCountryManager = title === 'Country';

    const { items: sortedItems, requestSort, sortConfig } = useSorting<StatusItem>(items, { key: 'name', direction: 'ascending' });

    useEffect(() => {
        if (!editingItem) {
            setName('');
            setColor('#2563eb');
            setProgress('0');
        }
    }, [editingItem]);

    useEffect(() => {
        setEditingItem(null);
        setName('');
        setColor('#2563eb');
        setProgress('0');
        setSearchTerm('');
    }, [title]);

    const filteredItems = useMemo(() => {
        return sortedItems.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [sortedItems, searchTerm]);

    const handleEditClick = (item: StatusItem) => {
        setEditingItem(item);
        setName(item.name);
        setColor(item.color || '#2563eb');
        setProgress(String(item.progress ?? 0));
    };

    const handleCancelEdit = () => {
        setEditingItem(null);
        setName('');
        setColor('#2563eb');
        setProgress('0');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() === '') return;
        const progressValue = Math.max(0, Math.min(100, Number(progress || 0)));

        try {
            if (editingItem) {
                await onUpdate({ ...editingItem, name: name.trim(), ...(enableColorProgress ? { color, progress: progressValue } : {}) });
                fireToast('success', `${title} updated successfully.`);
            } else {
                await onAdd(enableColorProgress ? { name: name.trim(), color, progress: progressValue } : name.trim());
                fireToast('success', `${title} added successfully.`);
            }
            handleCancelEdit();
        } catch (error: any) {
            fireToast('error', error?.message || `Failed to save ${title}.`);
        }
    };

    const handleDeleteClick = async (item: StatusItem) => {
        const result = await confirmDelete({
            title: `Delete ${title}?`,
            html: `Are you sure you want to delete "<strong>${item.name}</strong>"? This action cannot be undone.`,
        });
        if (result) {
            try {
                await onDelete(item.id);
                fireToast('success', `${title} "${item.name}" deleted.`);
            } catch (error: any) {
                fireToast('error', error?.message || `Failed to delete ${title}.`);
            }
        }
    };

    return (
        <div className={`grid grid-cols-1 ${isCountryManager ? 'xl:grid-cols-4' : 'lg:grid-cols-3'} gap-4 sm:gap-6`}>
            <div className={`${isCountryManager ? 'xl:col-span-1' : 'lg:col-span-1'} bg-white p-4 sm:p-6 rounded-xl shadow-md h-fit border border-gray-100`}>
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">{editingItem ? `Edit ${title}` : `Add ${title}`}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name <span className="text-primary">*</span></label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary focus:border-primary"
                            required
                            placeholder={`Enter ${title} name`}
                        />
                    </div>
                    {enableColorProgress && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Color <span className="text-primary">*</span></label>
                                <div className="mt-1 flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        className="h-10 w-12 border border-gray-300 rounded-md bg-white p-1"
                                    />
                                    <input
                                        type="text"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary focus:border-primary"
                                        placeholder="#2563eb"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Progress / Completion (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={progress}
                                    onChange={(e) => setProgress(e.target.value)}
                                    className="mt-1 w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary focus:border-primary"
                                    placeholder="0"
                                />
                            </div>
                        </>
                    )}
                    <div className="flex space-x-2">
                        <button type="submit" className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary/90 text-sm w-full">
                            {editingItem ? 'Update' : 'Submit'}
                        </button>
                        {editingItem && (
                            <button type="button" onClick={handleCancelEdit} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm">
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className={`${isCountryManager ? 'xl:col-span-3' : 'lg:col-span-2'} bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100 min-w-0`}>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
                    <div>
                        <h3 className="text-lg font-semibold">{title} List</h3>
                        {isCountryManager && (
                            <p className="text-xs text-gray-500 mt-0.5">
                                {filteredItems.length} of {items.length} countries shown
                            </p>
                        )}
                    </div>
                    <SearchInput
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={isCountryManager ? 'Search country...' : 'Search...'}
                        className="w-full md:max-w-xs"
                    />
                </div>

                {isCountryManager && (
                    <div className="md:hidden space-y-2 max-h-[58vh] overflow-y-auto pr-1 country-list-scroll">
                        {filteredItems.map((item, index) => (
                            <div key={item.id} className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-black text-gray-500">
                                            {index + 1}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-800 truncate">{item.name}</p>
                                            {(item.isoCode || item.phoneCode) && (
                                                <p className="text-[11px] text-gray-500 truncate">
                                                    {[item.isoCode, item.phoneCode].filter(Boolean).join(' • ')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button onClick={() => handleEditClick(item)} className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 bg-white hover:text-primary transition-colors">
                                        <i className="ri-pencil-fill text-base"></i>
                                    </button>
                                    <button onClick={() => handleDeleteClick(item)} className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 bg-white hover:text-red-500 transition-colors">
                                        <i className="ri-delete-bin-5-fill text-base"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                        {filteredItems.length === 0 && (
                            <div className="text-center py-10 text-gray-500 rounded-xl bg-gray-50 border border-dashed border-gray-200">No countries found.</div>
                        )}
                    </div>
                )}

                <div className={`${isCountryManager ? 'hidden md:block max-h-[62vh] overflow-auto country-list-scroll border border-gray-100 rounded-xl' : 'overflow-x-auto'}`}>
                    <table className="w-full text-sm min-w-[520px]">
                        <thead className={`${isCountryManager ? 'bg-gray-100 sticky top-0 z-10 shadow-sm' : 'bg-gray-100'}`}>
                            <tr>
                                <th className="p-3 text-left font-semibold text-gray-600 w-20">S.No</th>
                                <th className="p-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('name')}>
                                    <div className="flex items-center">Name {sortConfig?.key === 'name' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                                </th>
                                {isCountryManager && <th className="p-3 text-left font-semibold text-gray-600">ISO</th>}
                                {isCountryManager && <th className="p-3 text-left font-semibold text-gray-600">Phone Code</th>}
                                {enableColorProgress && <th className="p-3 text-left font-semibold text-gray-600">Color</th>}
                                {enableColorProgress && <th className="p-3 text-left font-semibold text-gray-600">Progress</th>}
                                <th className="p-3 text-left font-semibold text-gray-600 w-24">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredItems.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-3 text-gray-600">{index + 1}</td>
                                    <td className="p-3 font-medium text-gray-800">{item.name}</td>
                                    {isCountryManager && <td className="p-3 text-gray-600 font-mono text-xs">{item.isoCode || '-'}</td>}
                                    {isCountryManager && <td className="p-3 text-gray-600 font-mono text-xs">{item.phoneCode || '-'}</td>}
                                    {enableColorProgress && (
                                        <td className="p-3">
                                            <span className="inline-flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full border" style={{ backgroundColor: item.color || '#2563eb' }}></span>
                                                <span className="font-mono text-xs text-gray-600">{item.color || '#2563eb'}</span>
                                            </span>
                                        </td>
                                    )}
                                    {enableColorProgress && <td className="p-3 text-gray-700">{item.progress ?? 0}%</td>}
                                    <td className="p-3">
                                        <div className="flex items-center space-x-1">
                                            <Tooltip content={`Edit ${title}`}>
                                                <button onClick={() => handleEditClick(item)} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-primary transition-colors">
                                                    <i className="ri-pencil-fill text-base"></i>
                                                </button>
                                            </Tooltip>
                                            <Tooltip content={`Delete ${title}`}>
                                                <button onClick={() => handleDeleteClick(item)} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-red-500 transition-colors">
                                                    <i className="ri-delete-bin-5-fill text-base"></i>
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredItems.length === 0 && (
                                <tr><td colSpan={isCountryManager ? 5 : (enableColorProgress ? 5 : 3)} className="text-center py-6 text-gray-500">No items found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const CRMConfiguration: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'pipeline' | 'category' | 'country' | 'application' | 'passport' | 'document' | 'remark' | 'source' | 'service' | 'lost'>('pipeline');
    const { 
        leadStatuses, addLeadStatus, updateLeadStatus, deleteLeadStatus,
        leadCategories, addLeadCategory, updateLeadCategory, deleteLeadCategory,
        countries, addCountry, updateCountry, deleteCountry,
        applicationStatuses, addApplicationStatus, updateApplicationStatus, deleteApplicationStatus,
        passportStatuses, addPassportStatus, updatePassportStatus, deletePassportStatus,
        documentTypes, addDocumentType, updateDocumentType, deleteDocumentType,
        remarkStatuses, addRemarkStatus, updateRemarkStatus, deleteRemarkStatus,
        leadSources, addLeadSource, updateLeadSource, deleteLeadSource,
        serviceTypes, addServiceType, updateServiceType, deleteServiceType,
        lostReasons, addLostReason, updateLostReason, deleteLostReason,
    } = useCrm();

    const tabClass = (tabName: string) => {
        const isActive = activeTab === tabName;
        return `px-4 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors whitespace-nowrap ${
            isActive ? 'bg-primary text-white' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
        }`;
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'pipeline':
                return <StatusManager title="Lead Status" items={leadStatuses} onAdd={addLeadStatus} onUpdate={updateLeadStatus} onDelete={deleteLeadStatus} enableColorProgress />;
            case 'category':
                return <StatusManager title="Lead Category" items={leadCategories} onAdd={addLeadCategory} onUpdate={updateLeadCategory} onDelete={deleteLeadCategory} />;
            case 'country':
                return <StatusManager title="Country" items={countries} onAdd={addCountry} onUpdate={updateCountry} onDelete={deleteCountry} />;
            // case 'application':
            //     return <StatusManager title="Application Status" items={applicationStatuses} onAdd={addApplicationStatus} onUpdate={updateApplicationStatus} onDelete={deleteApplicationStatus} />;
            // case 'passport':
            //     return <StatusManager title="Passport Status" items={passportStatuses} onAdd={addPassportStatus} onUpdate={updatePassportStatus} onDelete={deletePassportStatus} />;
            case 'document':
                return <StatusManager title="Document List" items={documentTypes} onAdd={addDocumentType} onUpdate={updateDocumentType} onDelete={deleteDocumentType} />;
            case 'remark':
                return <StatusManager title="Remark Status" items={remarkStatuses} onAdd={addRemarkStatus} onUpdate={updateRemarkStatus} onDelete={deleteRemarkStatus} />;
            case 'source':
                return <StatusManager title="Lead Source" items={leadSources} onAdd={addLeadSource} onUpdate={updateLeadSource} onDelete={deleteLeadSource} />;
            case 'service':
                return <StatusManager title="Lead Type" items={serviceTypes} onAdd={addServiceType} onUpdate={updateServiceType} onDelete={deleteServiceType} />;
            case 'lost':
                return <StatusManager title="Lost Reason" items={lostReasons} onAdd={addLostReason} onUpdate={updateLostReason} onDelete={deleteLostReason} />;
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto max-w-full">
            <div className="flex space-x-2 mb-6 p-2 bg-white rounded-lg shadow-sm w-full overflow-x-auto thin-scrollbar">
                <button onClick={() => setActiveTab('pipeline')} className={tabClass('pipeline')}>Lead Status</button>
                <button onClick={() => setActiveTab('category')} className={tabClass('category')}>Lead Category</button>
                {/* <button onClick={() => setActiveTab('application')} className={tabClass('application')}>Application Status</button>
                <button onClick={() => setActiveTab('passport')} className={tabClass('passport')}>Passport Status</button> */}
                <button onClick={() => setActiveTab('document')} className={tabClass('document')}>Document List</button>
                <button onClick={() => setActiveTab('remark')} className={tabClass('remark')}>Remark Status</button>
                <button onClick={() => setActiveTab('source')} className={tabClass('source')}>Lead Source</button>
                <button onClick={() => setActiveTab('service')} className={tabClass('service')}>Lead Type</button>
                <button onClick={() => setActiveTab('lost')} className={tabClass('lost')}>Lost Reason</button>
                <button onClick={() => setActiveTab('country')} className={tabClass('country')}>Country</button>
            </div>
            <div>
                {renderContent()}
            </div>
            <style>{`
                .thin-scrollbar::-webkit-scrollbar { height: 6px; }
                .thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .thin-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
                .country-list-scroll {
                    scrollbar-width: thin;
                    scrollbar-color: #cbd5e1 transparent;
                    -webkit-overflow-scrolling: touch;
                }
                .country-list-scroll::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .country-list-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .country-list-scroll::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 999px;
                }
            `}</style>
        </div>
    );
};

export default CRMConfiguration;
