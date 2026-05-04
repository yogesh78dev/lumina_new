
import React from 'react';
import { useCrm } from '../hooks/useCrm';
import { usePermissions } from '../hooks/usePermissions';
import { useSwal } from '../hooks/useSwal';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/common/Pagination';
import { Role } from '../types';
import PageContainer from '../components/layout/PageContainer';

const RolesPage: React.FC = () => {
  const { roles, openRoleModal, deleteRole } = useCrm();
  const permissions = usePermissions();
  const { confirmDelete, fireToast } = useSwal();
  const canCreate = permissions.can('roles', 'create');
  const canUpdate = permissions.can('roles', 'update');
  const canDelete = permissions.can('roles', 'delete');

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
  } = usePagination(roles, 10);

  const handleDelete = async (id: string | number, name: string) => {
    const result = await confirmDelete({
        title: 'Delete Role?',
        html: <>Are you sure you want to delete the role "<strong>{name}</strong>"? This action cannot be undone.</>,
    });

    if (result) {
      // Fix line 71: cast id to string
      deleteRole(String(id));
      fireToast('success', `Role "${name}" deleted successfully.`);
    }
  }

  return (
    <PageContainer>
    <div className="container mx-auto">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Roles</h2>
        {canCreate && (
            <button onClick={() => openRoleModal(null)} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 flex items-center">
                <i className="ri-add-line mr-2"></i>
                Add Role
            </button>
        )}
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">Role Name</th>
                {(canUpdate || canDelete) && <th className="p-4 text-left text-sm font-semibold text-gray-600">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* FIX: Explicitly type 'role' to resolve property access errors on unknown type. */}
              {paginatedData.map((role: Role) => (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="p-4 whitespace-nowrap font-medium text-gray-900">{role.name}</td>
                  {(canUpdate || canDelete) && (
                    <td className="p-4 whitespace-nowrap text-sm font-medium space-x-4">
                        {canUpdate && <button onClick={() => openRoleModal(role)} className="text-primary hover:text-primary/90">Edit</button>}
                        {canDelete && <button onClick={() => handleDelete(role.id, role.name)} className="text-gray-500 hover:text-gray-700">Delete</button>}
                    </td>
                  )}
                </tr>
              ))}
               {paginatedData.length === 0 && (
                <tr><td colSpan={2} className="text-center py-10 text-gray-500">No roles found.</td></tr>
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
    </PageContainer>
  );
};

export default RolesPage;
