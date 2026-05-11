
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrm } from '../../hooks/useCrm';
import { usePermissions } from '../../hooks/usePermissions';
import { useSwal } from '../../hooks/useSwal';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../common/Pagination';
import { User } from '../../types';
import { capitalizeName } from '../../utils/formatters';
import { useSorting } from '../../hooks/useSorting';
import SearchInput from '../common/SearchInput';
import ToggleSwitch from '../common/ToggleSwitch';
import Tooltip from '../common/Tooltip';

const UserManagement: React.FC = () => {
    const { users, openUserModal, deleteUser, updateUser, userActivityLogs, currentUser } = useCrm();
    const permissions = usePermissions();
    const { confirmDelete, fireToast } = useSwal();
    const navigate = useNavigate();
    
    const canCreate = permissions.can('users', 'create');
    const canUpdate = permissions.can('users', 'update');
    const canDelete = permissions.can('users', 'delete');

    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = useMemo(() => {
        return users.filter(user => 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const usersWithLastLogin = useMemo(() => {
        return filteredUsers.map(user => {
            const logs = userActivityLogs.filter(log => String(log.userId) === String(user.id));
            const lastLogin = logs.length > 0 
                ? logs.reduce((latest, current) => 
                    new Date(current.loginDate) > new Date(latest.loginDate) ? current : latest
                  ).loginDate 
                : null;
            return { ...user, lastLogin };
        });
    }, [filteredUsers, userActivityLogs]);

    const { items: sortedUsers, requestSort, sortConfig } = useSorting<any>(usersWithLastLogin, { key: 'name', direction: 'ascending' });

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
    } = usePagination(sortedUsers, 10);

    const handleDelete = async (id: string | number, name: string) => {
        if (String(id) === String(currentUser?.id)) {
            fireToast('error', 'Security Violation: You cannot delete your own account while logged in.');
            return;
        }

        const userToDelete = users.find(u => String(u.id) === String(id));
        if (userToDelete && (userToDelete.role === 'Super Admin' || userToDelete.role === 'Admin') && currentUser?.role !== 'Super Admin') {
            fireToast('error', 'Permission Denied: Only Super Admins can delete other administrative accounts.');
            return;
        }

        const result = await confirmDelete({
            title: 'Confirm User Deletion',
            html: `
                <div class="text-left text-sm text-gray-600">
                    <p class="mb-2">Are you sure you want to permanently delete user "<strong>${name}</strong>"?</p>
                    <p class="text-xs text-red-500 italic font-medium">This will invalidate all active sessions for this user and remove their access to the system immediately.</p>
                </div>
            `,
        });

        if (result) {
            try {
                await deleteUser(String(id));
                fireToast('success', `User "${name}" has been successfully purged from the system.`);
            } catch (err: any) {
                fireToast('error', err.message || 'Failed to delete user.');
            }
        }
    }

    const handleToggleStatus = async (user: User) => {
        if (!canUpdate) return;
        const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
        await updateUser({ ...user, status: newStatus });
        fireToast('success', `User status updated to ${newStatus}`);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Manage Users</h2>
                 <div className="flex items-center space-x-2">
                    <SearchInput
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search users..."
                        className="w-64"
                    />
                     {canCreate && (
                        <button onClick={() => openUserModal(null)} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 flex items-center shadow-sm">
                            <i className="ri-add-line mr-2"></i>
                            Add User
                        </button>
                    )}
                 </div>
            </div>
            
            <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="p-4 text-left font-semibold text-gray-600">ID</th>
                        <th className="p-4 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('name')}>
                          <div className="flex items-center">Name {sortConfig?.key === 'name' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                        </th>
                        <th className="p-4 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('username')}>
                          <div className="flex items-center">User Name {sortConfig?.key === 'username' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                        </th>
                        <th className="p-4 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('role')}>
                           <div className="flex items-center">Role {sortConfig?.key === 'role' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                        </th>
                        <th className="p-4 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('lastLogin')}>
                           <div className="flex items-center">Last Login {sortConfig?.key === 'lastLogin' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                        </th>
                        <th className="p-4 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('status')}>
                          <div className="flex items-center">Status {sortConfig?.key === 'status' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                        </th>
                        {(canUpdate || canDelete) && <th className="p-4 text-center font-semibold text-gray-600">Action</th>}
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {paginatedData.map((user: any, index: number) => (
                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-4 whitespace-nowrap text-gray-500">{index + startIndex + 1}</td>
                            <td className="p-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mr-3 overflow-hidden">
                                        {user.imageUrl ? <img src={user.imageUrl} alt="" className="w-full h-full object-cover" /> : user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-medium text-gray-900">{capitalizeName(user.name)}</span>
                                </div>
                            </td>
                            <td className="p-4 whitespace-nowrap text-gray-600 font-mono text-xs">{user.username}</td>
                            <td className="p-4 whitespace-nowrap">
                                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md">{user.role}</span>
                            </td>
                            <td className="p-4 whitespace-nowrap text-xs text-gray-500">
                                {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : <span className="text-gray-300">Never</span>}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                    <ToggleSwitch
                                        checked={user.status === 'Active'}
                                        onChange={() => handleToggleStatus(user)}
                                        disabled={!canUpdate}
                                    />
                                    <span className={`text-xs font-medium ${user.status === 'Active' ? 'text-green-600' : 'text-red-500'}`}>
                                        {user.status}
                                    </span>
                                </div>
                            </td>
                            {(canUpdate || canDelete) && (
                                <td className="p-4 whitespace-nowrap text-center">
                                    <div className="flex items-center justify-center space-x-1">
                                        <Tooltip content="View Activity">
                                            <button onClick={() => navigate(`/settings/users/activity/${String(user.id)}`)} className="p-2 text-gray-500 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                                                <i className="ri-history-line text-lg"></i>
                                            </button>
                                        </Tooltip>
                                        {canUpdate && (
                                            <Tooltip content="Edit User">
                                                <button onClick={() => openUserModal(user)} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-primary transition-colors">
                                                    <i className="ri-pencil-fill text-base"></i>
                                                </button>
                                            </Tooltip>
                                        )}
                                        {canDelete && (
                                            <Tooltip content="Delete User">
                                                <button onClick={() => handleDelete(user.id, user.name)} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-red-500 transition-colors">
                                                    <i className="ri-delete-bin-5-fill text-base"></i>
                                                </button>
                                            </Tooltip>
                                        )}
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
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
    );
};

export default UserManagement;
