
import React, { useState } from 'react';
import { useCrm } from '../../hooks/useCrm';
import { useSwal } from '../../hooks/useSwal';
import ToggleSwitch from '../common/ToggleSwitch';
import { PermissionCategory, PermissionSection } from '../../types';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../common/Pagination';
import { useSorting } from '../../hooks/useSorting';
import PageContainer from '../layout/PageContainer';
import Tooltip from '../common/Tooltip';

// Permission Category Management Component
const PermissionCategoryManagement: React.FC = () => {
    const { permissionCategories, addPermissionCategory, updatePermissionCategory, deletePermissionCategory } = useCrm();
    const { fireToast, confirmDelete } = useSwal();
    
    const getInitialState = () => ({
        title: '',
        status: 'Active' as 'Active' | 'Inactive',
    });

    const [formData, setFormData] = useState(getInitialState());
    const [isFormVisible, setIsFormVisible] = useState(false);

    const { items: sortedCategories, requestSort, sortConfig } = useSorting<PermissionCategory>(permissionCategories, { key: 'title', direction: 'ascending' });
    
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
    } = usePagination(sortedCategories, 10);

    const handleCancel = () => {
        setIsFormVisible(false);
        setFormData(getInitialState());
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await addPermissionCategory({ title: formData.title, status: formData.status });
        fireToast('success', 'Permission Category added!');
        handleCancel();
    };
    
    const handleToggleStatus = (category: PermissionCategory) => {
        updatePermissionCategory({ ...category, status: category.status === 'Active' ? 'Inactive' : 'Active' });
    };

    const handleDelete = async (category: PermissionCategory) => {
        const result = await confirmDelete({title: 'Delete Category?', html: `Are you sure you want to delete "${category.title}"?`});
        if (result) {
            // FIX line 58: cast category.id to string
            deletePermissionCategory(String(category.id));
            fireToast('success', 'Category deleted.');
        }
    };
    
    return (
       <div className="space-y-6">
            {isFormVisible && (
                <form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-gray-50/50 space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Add New Category</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Permission Category <span className="text-primary">*</span></label>
                        <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1 input-field" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status <span className="text-primary">*</span></label>
                         <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="mt-1 input-field">
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={handleCancel} className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90">Submit</button>
                    </div>
                </form>
            )}

            <div>
                <div className="pb-4 flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Permission Category List</h3>
                    {!isFormVisible && (
                        <button onClick={() => setIsFormVisible(true)} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 flex items-center">
                            <i className="ri-add-line mr-2"></i>
                            Add Category
                        </button>
                    )}
                </div>
                <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-left font-semibold text-gray-600">S.No</th>
                                <th className="p-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('title')}>
                                    <div className="flex items-center">Title {sortConfig?.key === 'title' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                                </th>
                                <th className="p-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('status')}>
                                    <div className="flex items-center">Status {sortConfig?.key === 'status' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                                </th>
                                <th className="p-3 text-left font-semibold text-gray-600">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {paginatedData.length > 0 ? (
                                paginatedData.map((cat: PermissionCategory, i: number) => (
                                    <tr key={cat.id}>
                                        <td className="p-3">{startIndex + i}</td>
                                        <td className="p-3">{cat.title}</td>
                                        <td className="p-3"><ToggleSwitch checked={cat.status === 'Active'} onChange={() => handleToggleStatus(cat)} /></td>
                                        <td className="p-3">
                                            <Tooltip content="Delete Category">
                                                <button className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-red-500 transition-colors" onClick={() => handleDelete(cat)}>
                                                    <i className="ri-delete-bin-5-fill text-base"></i>
                                                </button>
                                            </Tooltip>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-6 text-gray-500">No categories found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
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
       </div>
    );
};

// Permission Section Management Component
const PermissionSectionManagement: React.FC = () => {
    const { permissionSections, permissionCategories, addPermissionSection, updatePermissionSection, deletePermissionSection } = useCrm();
    const { fireToast, confirmDelete } = useSwal();
    
    const getInitialState = () => ({
        title: '',
        category: permissionCategories.find(c => c.status === 'Active')?.title || '',
        status: 'Active' as 'Active' | 'Inactive',
    });

    const [formData, setFormData] = useState(getInitialState());
    const [isFormVisible, setIsFormVisible] = useState(false);
    
    const { items: sortedSections, requestSort, sortConfig } = useSorting<PermissionSection>(permissionSections, { key: 'title', direction: 'ascending'});

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
    } = usePagination(sortedSections, 10);

    const handleCancel = () => {
        setIsFormVisible(false);
        setFormData(getInitialState());
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await addPermissionSection({ title: formData.title, status: formData.status, category: formData.category });
        fireToast('success', 'Permission Section added!');
        handleCancel();
    };

    const handleToggleStatus = (section: PermissionSection) => {
        updatePermissionSection({ ...section, status: section.status === 'Active' ? 'Inactive' : 'Active' });
    };

     const handleDelete = async (section: PermissionSection) => {
        const result = await confirmDelete({title: 'Delete Section?', html: `Are you sure you want to delete "${section.title}"?`});
        if (result) {
            // FIX line 196: cast section.id to string
            deletePermissionSection(String(section.id));
            fireToast('success', 'Section deleted.');
        }
    };

    return (
        <div className="space-y-6">
             {isFormVisible && (
                <form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-gray-50/50 space-y-4">
                     <h3 className="text-lg font-semibold border-b pb-2">Add Section</h3>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Permission Category <span className="text-primary">*</span></label>
                         <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="mt-1 input-field">
                            <option value="" disabled>Select a category</option>
                            {permissionCategories.filter(c => c.status === 'Active').map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Permission Section <span className="text-primary">*</span></label>
                        <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1 input-field" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status <span className="text-primary">*</span></label>
                         <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="mt-1 input-field">
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2">
                         <button type="button" onClick={handleCancel} className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90">Submit</button>
                    </div>
                </form>
            )}

            <div>
                <div className="pb-4 flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Permission Section List</h3>
                    {!isFormVisible && (
                        <button onClick={() => setIsFormVisible(true)} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 flex items-center">
                            <i className="ri-add-line mr-2"></i>
                            Add Section
                        </button>
                    )}
                </div>
                <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-left font-semibold text-gray-600">S.No</th>
                                <th className="p-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('title')}>
                                    <div className="flex items-center">Title {sortConfig?.key === 'title' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                                </th>
                                <th className="p-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('category')}>
                                    <div className="flex items-center">Category {sortConfig?.key === 'category' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                                </th>
                                <th className="p-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('status')}>
                                    <div className="flex items-center">Status {sortConfig?.key === 'status' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                                </th>
                                <th className="p-3 text-left font-semibold text-gray-600">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                           {paginatedData.length > 0 ? (
                                paginatedData.map((sec: PermissionSection, i: number) => (
                                    <tr key={sec.id}>
                                        <td className="p-3">{startIndex + i}</td>
                                        <td className="p-3">{sec.title}</td>
                                        <td className="p-3">{sec.category}</td>
                                        <td className="p-3"><ToggleSwitch checked={sec.status === 'Active'} onChange={() => handleToggleStatus(sec)} /></td>
                                        <td className="p-3">
                                            <Tooltip content="Delete Section">
                                                <button className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-red-500 transition-colors" onClick={() => handleDelete(sec)}>
                                                    <i className="ri-delete-bin-5-fill text-base"></i>
                                                </button>
                                            </Tooltip>
                                        </td>
                                    </tr>
                                ))
                           ) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-6 text-gray-500">No sections found.</td>
                                </tr>
                           )}
                        </tbody>
                    </table>
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
       </div>
    );
};

const SecurityControlsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('category');

  const TABS = [
    { id: 'category', name: 'Permission Categories' },
    { id: 'section', name: 'Permission Sections' },
  ];

  const renderContent = () => {
    switch(activeTab) {
        case 'category': return <PermissionCategoryManagement />;
        case 'section': return <PermissionSectionManagement />;
        default: return null;
    }
  }

  return (
    <PageContainer>
    <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === tab.id
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        {tab.name}
                    </button>
                ))}
            </nav>
        </div>
        <div className="p-6">
            {renderContent()}
        </div>
    </div>
    </PageContainer>
  );
};

export default SecurityControlsPage;
