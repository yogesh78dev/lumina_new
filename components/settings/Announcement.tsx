
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrm } from '../../hooks/useCrm';
import { useSwal } from '../../hooks/useSwal';
import { Announcement as AnnouncementType } from '../../types';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../common/Pagination';
import { capitalizeName } from '../../utils/formatters';

const AnnouncementList: React.FC = () => {
    const { announcements, users, deleteAnnouncement } = useCrm();
    const { confirmDelete, fireToast } = useSwal();

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
    } = usePagination(announcements.slice().sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()), 5);

    const getAuthorName = (authorId: string | number) => {
        return capitalizeName(users.find(u => String(u.id) === String(authorId))?.name || 'Unknown');
    }

    const getStatus = (scheduledAt: string) => {
        return new Date(scheduledAt) > new Date() ? 'Scheduled' : 'Sent';
    }

    const handleDelete = async (ann: AnnouncementType) => {
        const result = await confirmDelete({ title: 'Delete Announcement?', html: `Are you sure you want to delete this announcement?` });
        if (result && ann.id) {
            await deleteAnnouncement(ann.id);
            fireToast('success', 'Announcement deleted successfully!');
        }
    };

    return (
        <div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                            <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Subject</th>
                            <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Created By</th>
                            <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Scheduled At</th>
                            <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                            <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                        {paginatedData.map((ann: AnnouncementType, index: number) => (
                            <tr key={ann.id}>
                                <td className="p-3 whitespace-nowrap text-gray-500">#{ (startIndex + index).toString().padStart(3, '0')}</td>
                                <td className="p-3 font-medium text-gray-800">{ann.subject}</td>
                                <td className="p-3 text-gray-600">{getAuthorName(ann.authorId)}</td>
                                <td className="p-3 text-gray-600">{new Date(ann.scheduledAt).toLocaleString()}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatus(ann.scheduledAt) === 'Sent' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {getStatus(ann.scheduledAt)}
                                    </span>
                                </td>
                                <td className="p-3">
                                    <button 
                                        onClick={() => handleDelete(ann)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        <i className="ri-delete-bin-line"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {announcements.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-gray-500">No announcements found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {announcements.length > 0 && (
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
            )}
        </div>
    );
}

const Announcement: React.FC = () => {
    const navigate = useNavigate();
    const { users, addAnnouncement } = useCrm();
    const { fireToast } = useSwal();
    const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
    
    const TABS = [
        { id: 'create', name: 'Announcement' },
        { id: 'list', name: 'Announcement List' }
    ];

    const getInitialState = () => ({
        subject: '',
        content: '',
        recipients: [] as string[],
        scheduledAt: new Date(new Date().toString().split('GMT')[0]+' UTC').toISOString().slice(0, 16),
    });

    const [formData, setFormData] = useState(getInitialState());
    
    const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        if (value === 'all') {
            // FIX line 107: ensure recipients type compatibility
            setFormData(prev => ({
                ...prev,
                recipients: checked ? users.map(u => String(u.id)) : []
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                recipients: checked
                    ? [...prev.recipients, value]
                    : prev.recipients.filter(id => id !== value)
            }));
        }
    };
    
    const handleClear = () => {
        setFormData(getInitialState());
    }

    const handleSubmit = (e: React.FormEvent, saveAndNew = false) => {
        e.preventDefault();
        addAnnouncement(formData);
        fireToast('success', 'Announcement has been scheduled!');
        if (saveAndNew) {
            handleClear();
        } else {
             setActiveTab('list');
        }
    }

    const isAllSelected = users.length > 0 && formData.recipients.length === users.length;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
             <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Announcement</h3>
                
                <div className="flex flex-wrap p-1 bg-gray-100 rounded-lg items-center flex-shrink-0">
                    <button onClick={() => setActiveTab('create')} className={`px-3 py-1.5 text-sm font-medium rounded-md ${activeTab === 'create' ? 'bg-primary text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Announcement</button>
                    <button onClick={() => setActiveTab('list')} className={`px-3 py-1.5 text-sm font-medium rounded-md ml-1 ${activeTab === 'list' ? 'bg-primary text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Announcement List</button>
                </div>
            </div>
            {activeTab === 'create' ? (
                 <form>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Subject</label>
                            <input
                                type="text"
                                value={formData.subject}
                                onChange={e => setFormData({...formData, subject: e.target.value})}
                                className="mt-1 input-field"
                            />
                        </div>
                        <div>
                            {/* Placeholder for a rich text editor */}
                            <textarea
                                rows={8}
                                value={formData.content}
                                onChange={e => setFormData({...formData, content: e.target.value})}
                                className="mt-1 input-field"
                                placeholder="Compose your announcement..."
                            ></textarea>
                        </div>
                        <div>
                            <p className="block text-sm font-medium text-gray-700 mb-2">Select Users</p>
                            <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                                <label className="flex items-center space-x-2 p-1">
                                    <input type="checkbox" checked={isAllSelected} value="all" onChange={handleRecipientChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                    <span>Select All (User)</span>
                                </label>
                                {users.map(user => (
                                    <label key={user.id} className="flex items-center space-x-2 p-1">
                                         {/* FIX line 179: cast user.id to string */}
                                         <input type="checkbox" checked={formData.recipients.includes(String(user.id))} value={String(user.id)} onChange={handleRecipientChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                        <span>{capitalizeName(user.name)}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date</label>
                                <input
                                    type="datetime-local"
                                    value={formData.scheduledAt}
                                    onChange={e => setFormData({...formData, scheduledAt: e.target.value})}
                                    className="mt-1 input-field"
                                />
                            </div>
                        </div>
                    </div>
                     <div className="flex justify-start space-x-3 pt-6 mt-6 border-t">
                        <button type="button" onClick={handleClear} className="px-5 py-2.5 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 text-sm">
                            Clear
                        </button>
                        <button type="button" onClick={(e) => handleSubmit(e, false)} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 text-sm">
                            Submit Details
                        </button>
                        <button type="button" onClick={(e) => handleSubmit(e, true)} className="px-5 py-2.5 bg-secondary text-white font-semibold rounded-lg hover:bg-black text-sm">
                            Save & New
                        </button>
                    </div>
                </form>
            ) : (
                <AnnouncementList />
            )}
        </div>
    );
};

export default Announcement;
