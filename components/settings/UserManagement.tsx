
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

const UserManagement: React.FC = () => {
    const { users, openUserModal, deleteUser } = useCrm();
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
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const { items: sortedUsers, requestSort, sortConfig } = useSorting<User>(filteredUsers, { key: 'name', direction: 'ascending' });

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
        const result = await confirmDelete({
            title: 'Delete User?',
            html: <>Are you sure you want to delete user "<strong>{name}</strong>"? This action cannot be undone.</>,
        });

        if (result) {
            deleteUser(String(id));
            fireToast('success', `User "${name}" deleted successfully.`);
        }
    }

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
                        <button onClick={() => openUserModal(null)} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 flex items-center">
                            <i className="ri-add-line mr-2"></i>
                            Add User
                        </button>
                    )}
                 </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="p-3 text-left font-semibold text-gray-600">ID</th>
                        <th className="p-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('name')}>
                          <div className="flex items-center">Name {sortConfig?.key === 'name' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                        </th>
                        <th className="p-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('username')}>
                          <div className="flex items-center">User Name {sortConfig?.key === 'username' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                        </th>
                        <th className="p-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('role')}>
                           <div className="flex items-center">Role {sortConfig?.key === 'role' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                        </th>
                        <th className="p-3 text-left font-semibold text-gray-600">View Activity</th>
                        <th className="p-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('status')}>
                          <div className="flex items-center">Status {sortConfig?.key === 'status' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                        </th>
                        {(canUpdate || canDelete) && <th className="p-3 text-left font-semibold text-gray-600">Action</th>}
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {paginatedData.map((user: User, index: number) => (
                        <tr key={user.id}>
                            <td className="p-3 whitespace-nowrap text-gray-500">{index + startIndex}</td>
                            <td className="p-3 whitespace-nowrap font-medium text-primary">{capitalizeName(user.name)}</td>
                            <td className="p-3 whitespace-nowrap text-gray-600">{capitalizeName(user.username)}</td>
                            <td className="p-3 whitespace-nowrap text-gray-600">{user.role}</td>
                            <td className="p-3 whitespace-nowrap">
                                {/* FIX line 130: cast user.id to string */}
                                <button onClick={() => navigate(`/settings/users/activity/${String(user.id)}`)} className="px-3 py-1 text-xs font-medium text-white bg-primary rounded-md hover:bg-primary/90">View Activity</button>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {user.status}
                                </span>
                            </td>
                            {(canUpdate || canDelete) && (
                                <td className="p-3 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center space-x-1">
                                        {canUpdate && (
                                            <div className="relative group">
                                                <button onClick={() => openUserModal(user)} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-primary transition-colors">
                                                    <i className="ri-pencil-fill text-base"></i>
                                                </button>
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10 pointer-events-none">
                                                    Edit User
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                                                </div>
                                            </div>
                                        )}
                                        {canDelete && (
                                            <div className="relative group">
                                                <button onClick={() => handleDelete(user.id, user.name)} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-red-500 transition-colors">
                                                    <i className="ri-delete-bin-5-fill text-base"></i>
                                                </button>
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10 pointer-events-none">
                                                    Delete User
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                                                </div>
                                            </div>
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
