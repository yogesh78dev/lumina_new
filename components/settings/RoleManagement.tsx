
import React from 'react';
import { useCrm } from '../../hooks/useCrm';
import { usePermissions } from '../../hooks/usePermissions';
import { useSwal } from '../../hooks/useSwal';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../common/Pagination';
import { Role } from '../../types';
import { useSorting } from '../../hooks/useSorting';
import Tooltip from '../common/Tooltip';

const RoleManagement: React.FC = () => {
  const { roles, openRoleModal, deleteRole } = useCrm();
  const permissions = usePermissions();
  const { confirmDelete, fireToast } = useSwal();
  
  const canCreate = permissions.can('roles', 'create');
  const canUpdate = permissions.can('roles', 'update');
  const canDelete = permissions.can('roles', 'delete');

  const { items: sortedRoles, requestSort, sortConfig } = useSorting<Role>(roles, { key: 'name', direction: 'ascending'});

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
  } = usePagination(sortedRoles, 10);

  const handleDelete = async (role: Role) => {
    if (String(role.id) === '1' || role.name.toLowerCase() === 'super admin') {
        fireToast('error', 'The Super Admin role is system-protected and cannot be deleted.');
        return;
    }

    const result = await confirmDelete({
        title: 'Delete Role?',
        html: <>Are you sure you want to delete the role "<strong>{role.name}</strong>"? Users assigned to this role will lose their current permissions.</>,
    });

    if (result) {
      try {
        await deleteRole(String(role.id));
        fireToast('success', `Role "${role.name}" deleted successfully.`);
      } catch (err: any) {
        fireToast('error', err.message || 'Failed to delete role.');
      }
    }
  }

  const isSystemRole = (role: Role) => {
      return String(role.id) === '1' || role.name.toLowerCase() === 'super admin';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-semibold text-gray-800">User Roles</h2>
            <p className="text-sm text-gray-500 mt-1">Manage system access levels and permissions matrix.</p>
        </div>
        {canCreate && (
            <button onClick={() => openRoleModal(null)} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 flex items-center shadow-sm transition-all hover:shadow-md">
                <i className="ri-add-line mr-2"></i>
                Create Role
            </button>
        )}
      </div>
      
      <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('name')}>
                  <div className="flex items-center">Role Name {sortConfig?.key === 'name' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">Permissions Summary</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">Status</th>
                {(canUpdate || canDelete) && <th className="p-4 text-left text-sm font-semibold text-gray-600">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.map((role: Role) => {
                const isProtected = isSystemRole(role);
                const activeModules = Object.entries(role.permissions || {})
                    .filter(([_, actions]) => actions && actions.length > 0)
                    .map(([mod, _]) => mod);

                return (
                    <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{role.name}</span>
                            {isProtected && <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded uppercase tracking-wider">System Protected</span>}
                        </div>
                    </td>
                    <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-md">
                            {isProtected ? (
                                <span className="text-xs font-medium text-gray-500 italic">Full System Access (Locked)</span>
                            ) : activeModules.length > 0 ? (
                                activeModules.map(m => (
                                    <span key={m} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase border border-blue-100">
                                        {m}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs font-medium text-gray-400">No Permissions Set</span>
                            )}
                        </div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${role.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            {role.status || 'Active'}
                        </span>
                    </td>
                    {(canUpdate || canDelete) && (
                        <td className="p-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                                {canUpdate && (
                                    <Tooltip content={isProtected ? "View Full Access" : "Edit Permissions"}>
                                        <button 
                                            onClick={() => openRoleModal(role)} 
                                            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isProtected ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'}`}
                                            disabled={isProtected}
                                        >
                                            <i className="ri-pencil-fill text-lg"></i>
                                        </button>
                                    </Tooltip>
                                )}
                                {canDelete && (
                                    <Tooltip content={isProtected ? "Cannot Delete System Role" : "Delete Role"}>
                                        <button 
                                            onClick={() => handleDelete(role)} 
                                            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isProtected ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:bg-red-50 hover:text-red-600'}`}
                                            disabled={isProtected}
                                        >
                                            <i className="ri-delete-bin-line text-lg"></i>
                                        </button>
                                    </Tooltip>
                                )}
                            </div>
                        </td>
                    )}
                    </tr>
                );
              })}
               {paginatedData.length === 0 && (
                <tr><td colSpan={4} className="text-center py-12 text-gray-500 italic">No custom roles defined.</td></tr>
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
  );
};

export default RoleManagement;
