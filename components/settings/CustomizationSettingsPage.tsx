
import React, { useState, useMemo, useEffect } from 'react';
import { useCrm } from '../../hooks/useCrm';
import { useSwal } from '../../hooks/useSwal';
import { SaleBy, WorkedBy } from '../../types';
import { Link } from 'react-router-dom';
import { useSorting } from '../../hooks/useSorting';
import SearchInput from '../common/SearchInput';

type Entity = SaleBy | WorkedBy;

interface EntityManagementProps {
  title: string;
  items: Entity[];
  onAdd: (data: Omit<Entity, 'id'>) => void;
  onUpdate: (data: Entity) => void;
  onDelete: (id: string) => void;
  showForm?: boolean;
}

const EntityManagement: React.FC<EntityManagementProps> = ({ title, items, onAdd, onUpdate, onDelete, showForm = true }) => {
  const { fireToast, confirmDelete } = useSwal();
  
  const getInitialFormState = () => ({ name: '', status: 'Active' as 'Active' | 'Inactive' });

  const [formData, setFormData] = useState(getInitialFormState());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { items: sortedItems, requestSort, sortConfig } = useSorting<Entity>(items, { key: 'name', direction: 'ascending'});

  useEffect(() => {
    if (!editingId) {
        setFormData(getInitialFormState());
    }
  }, [editingId]);

  const filteredItems = useMemo(() => {
    return sortedItems.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [sortedItems, searchTerm]);

  const handleEditClick = (item: Entity) => {
    // FIX: Cast item.id to string to match SetStateAction<string | null>
    setEditingId(String(item.id));
    setFormData({ name: item.name, status: item.status });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(getInitialFormState());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() === '') return;

    if (editingId) {
      onUpdate({ id: editingId, ...formData });
      fireToast('success', `${title} updated successfully.`);
    } else {
      onAdd(formData);
      fireToast('success', `${title} added successfully.`);
    }
    handleCancelEdit();
  };

  const handleDeleteClick = async (item: Entity) => {
    const result = await confirmDelete({
      title: `Delete ${title}?`,
      html: `Are you sure you want to delete "<strong>${item.name}</strong>"? This action cannot be undone.`,
    });
    if (result) {
      // FIX: Cast item.id to string
      onDelete(String(item.id));
      fireToast('success', `${title} "${item.name}" deleted.`);
    }
  };
  
  const FormComponent = (
    <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md h-fit">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">{editingId ? `Edit ${title}` : title}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Name <span className="text-primary">*</span></label>
                <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary focus:border-primary"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Status <span className="text-primary">*</span></label>
                <select 
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({...prev, status: e.target.value as 'Active' | 'Inactive'}))}
                    className="mt-1 w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-primary focus:border-primary"
                >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
            </div>
            <div className="flex space-x-2">
                <button type="submit" className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary/90 text-sm w-full">
                    {editingId ? 'Update' : 'Submit'}
                </button>
                {editingId && (
                    <button type="button" onClick={handleCancelEdit} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm">
                        Cancel
                    </button>
                )}
            </div>
        </form>
    </div>
  );
  
  const ListComponent = (
    <div className={showForm ? "lg:col-span-2 bg-white p-6 rounded-lg shadow-md" : "bg-white p-6 rounded-lg shadow-md"}>
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
                          <div className="flex items-center">Title {sortConfig?.key === 'name' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                        </th>
                        <th className="p-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('status')}>
                          <div className="flex items-center">Status {sortConfig?.key === 'status' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                        </th>
                        {showForm && <th className="p-3 text-left font-semibold text-gray-600">Action</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {filteredItems.map((item, index) => (
                        <tr key={item.id}>
                            <td className="p-3 text-gray-600">{index + 1}</td>
                            <td className="p-3 font-medium text-gray-800">{item.name}</td>
                            <td className="p-3">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {item.status}
                                </span>
                            </td>
                            {showForm && (
                                <td className="p-3">
                                    <div className="flex items-center space-x-1">
                                        <div className="relative group">
                                            <button onClick={() => handleEditClick(item)} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-primary transition-colors">
                                                <i className="ri-pencil-fill text-base"></i>
                                            </button>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10 pointer-events-none">
                                                {`Edit ${title}`}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                                            </div>
                                        </div>
                                        <div className="relative group">
                                            <button onClick={() => handleDeleteClick(item)} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-red-500 transition-colors">
                                                <i className="ri-delete-bin-5-fill text-base"></i>
                                            </button>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10 pointer-events-none">
                                                {`Delete ${title}`}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                    {filteredItems.length === 0 && (
                        <tr><td colSpan={showForm ? 4 : 3} className="text-center py-6 text-gray-500">No items found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {showForm && FormComponent}
        {ListComponent}
    </div>
  );
};


const CustomizationSettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'saleBy' | 'workedBy'>('dashboard');
    const { 
        saleBy, addSaleBy, updateSaleBy, deleteSaleBy,
        workedBy, addWorkedBy, updateWorkedBy, deleteWorkedBy
    } = useCrm();

    const tabClass = (tabName: string) => {
        const isActive = activeTab === tabName;
        return `px-4 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors ${
            isActive ? 'bg-primary text-white' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
        }`;
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'saleBy':
                return <EntityManagement title="Sale By" items={saleBy} onAdd={addSaleBy} onUpdate={updateSaleBy} onDelete={deleteSaleBy} />;
            case 'workedBy':
                return <EntityManagement title="Worked By" items={workedBy} onAdd={addWorkedBy} onUpdate={updateWorkedBy} onDelete={deleteWorkedBy} />;
            case 'dashboard':
            default:
                return <EntityManagement title="Worked By" items={workedBy} onAdd={addWorkedBy} onUpdate={updateWorkedBy} onDelete={deleteWorkedBy} showForm={false} />;
        }
    };

  return (
    <div className="container mx-auto">
        <div className="mb-4">
            <Link to="/settings" className="text-primary hover:underline text-sm flex items-center">
                <i className="ri-arrow-left-line mr-2"></i>
                Back to Settings
            </Link>
        </div>
        <div className="flex space-x-2 mb-6 p-2 bg-white rounded-lg shadow-sm w-fit">
            <button onClick={() => setActiveTab('dashboard')} className={tabClass('dashboard')}>Dashboard</button>
            <button onClick={() => setActiveTab('saleBy')} className={tabClass('saleBy')}>Sale By</button>
            <button onClick={() => setActiveTab('workedBy')} className={tabClass('workedBy')}>Worked By</button>
        </div>
        <div>
            {renderContent()}
        </div>
    </div>
  );
};

export default CustomizationSettingsPage;
