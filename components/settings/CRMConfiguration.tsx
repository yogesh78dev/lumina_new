
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
}

interface StatusManagerProps {
    title: string;
    items: StatusItem[];
    onAdd: (name: string) => void;
    onUpdate: (item: StatusItem) => void;
    // FIX: Match signature to allow string or number id
    onDelete: (id: string | number) => void;
}

const StatusManager: React.FC<StatusManagerProps> = ({ title, items, onAdd, onUpdate, onDelete }) => {
    const { fireToast, confirmDelete } = useSwal();
    const [name, setName] = useState('');
    const [editingItem, setEditingItem] = useState<StatusItem | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { items: sortedItems, requestSort, sortConfig } = useSorting<StatusItem>(items, { key: 'name', direction: 'ascending' });

    useEffect(() => {
        if (!editingItem) {
            setName('');
        }
    }, [editingItem]);

    const filteredItems = useMemo(() => {
        return sortedItems.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [sortedItems, searchTerm]);

    const handleEditClick = (item: StatusItem) => {
        setEditingItem(item);
        setName(item.name);
    };

    const handleCancelEdit = () => {
        setEditingItem(null);
        setName('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() === '') return;

        if (editingItem) {
            onUpdate({ ...editingItem, name });
            fireToast('success', `${title} updated successfully.`);
        } else {
            onAdd(name);
            fireToast('success', `${title} added successfully.`);
        }
        handleCancelEdit();
    };

    const handleDeleteClick = async (item: StatusItem) => {
        const result = await confirmDelete({
            title: `Delete ${title}?`,
            html: `Are you sure you want to delete "<strong>${item.name}</strong>"? This action cannot be undone.`,
        });
        if (result) {
            onDelete(item.id);
            fireToast('success', `${title} "${item.name}" deleted.`);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md h-fit">
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

            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">{title} List</h3>
                    <SearchInput
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search..."
                        className="w-full max-w-xs"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 text-left font-semibold text-gray-600">S.No</th>
                                <th className="p-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('name')}>
                                    <div className="flex items-center">Name {sortConfig?.key === 'name' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                                </th>
                                <th className="p-3 text-left font-semibold text-gray-600">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredItems.map((item, index) => (
                                <tr key={item.id}>
                                    <td className="p-3 text-gray-600">{index + 1}</td>
                                    <td className="p-3 font-medium text-gray-800">{item.name}</td>
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
                                <tr><td colSpan={3} className="text-center py-6 text-gray-500">No items found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const CRMConfiguration: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'pipeline' | 'application' | 'passport' | 'document' | 'remark' | 'source' | 'service' | 'lost'>('pipeline');
    const { 
        leadStatuses, addLeadStatus, updateLeadStatus, deleteLeadStatus,
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
                return <StatusManager title="Pipeline Status" items={leadStatuses} onAdd={addLeadStatus} onUpdate={updateLeadStatus} onDelete={deleteLeadStatus} />;
            case 'application':
                return <StatusManager title="Application Status" items={applicationStatuses} onAdd={addApplicationStatus} onUpdate={updateApplicationStatus} onDelete={deleteApplicationStatus} />;
            case 'passport':
                return <StatusManager title="Passport Status" items={passportStatuses} onAdd={addPassportStatus} onUpdate={updatePassportStatus} onDelete={deletePassportStatus} />;
            case 'document':
                return <StatusManager title="Document List" items={documentTypes} onAdd={addDocumentType} onUpdate={updateDocumentType} onDelete={deleteDocumentType} />;
            case 'remark':
                return <StatusManager title="Remark Status" items={remarkStatuses} onAdd={addRemarkStatus} onUpdate={updateRemarkStatus} onDelete={deleteRemarkStatus} />;
            case 'source':
                return <StatusManager title="Lead Source" items={leadSources} onAdd={addLeadSource} onUpdate={updateLeadSource} onDelete={deleteLeadSource} />;
            case 'service':
                return <StatusManager title="Service Type" items={serviceTypes} onAdd={addServiceType} onUpdate={updateServiceType} onDelete={deleteServiceType} />;
            case 'lost':
                return <StatusManager title="Lost Reason" items={lostReasons} onAdd={addLostReason} onUpdate={updateLostReason} onDelete={deleteLostReason} />;
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto">
            <div className="flex space-x-2 mb-6 p-2 bg-white rounded-lg shadow-sm w-full overflow-x-auto thin-scrollbar">
                <button onClick={() => setActiveTab('pipeline')} className={tabClass('pipeline')}>Pipeline Status</button>
                <button onClick={() => setActiveTab('application')} className={tabClass('application')}>Application Status</button>
                <button onClick={() => setActiveTab('passport')} className={tabClass('passport')}>Passport Status</button>
                <button onClick={() => setActiveTab('document')} className={tabClass('document')}>Document List</button>
                <button onClick={() => setActiveTab('remark')} className={tabClass('remark')}>Remark Status</button>
                <button onClick={() => setActiveTab('source')} className={tabClass('source')}>Lead Source</button>
                <button onClick={() => setActiveTab('service')} className={tabClass('service')}>Service Type</button>
                <button onClick={() => setActiveTab('lost')} className={tabClass('lost')}>Lost Reason</button>
            </div>
            <div>
                {renderContent()}
            </div>
            <style>{`
                .thin-scrollbar::-webkit-scrollbar { height: 6px; }
                .thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .thin-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
            `}</style>
        </div>
    );
};

export default CRMConfiguration;
