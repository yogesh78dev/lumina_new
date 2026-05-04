
import React from 'react';
import { useCrm } from '../hooks/useCrm';
import { usePermissions } from '../hooks/usePermissions';
import { useSwal } from '../hooks/useSwal';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/common/Pagination';
import { Vendor } from '../types';
import { useSorting } from '../hooks/useSorting';
import PageContainer from '../components/layout/PageContainer';
import Tooltip from '../components/common/Tooltip';

const VendorsPage: React.FC = () => {
  const { vendors, customers, openVendorModal, deleteVendor } = useCrm();
  const permissions = usePermissions();
  const { confirmDelete, fireToast } = useSwal();
  const canCreate = permissions.can('vendors', 'create');
  const canUpdate = permissions.can('vendors', 'update');
  const canDelete = permissions.can('vendors', 'delete');

  const { items: sortedVendors, requestSort, sortConfig } = useSorting<Vendor>(vendors, { key: 'name', direction: 'ascending'});

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
  } = usePagination(sortedVendors, 10);

  const handleDelete = async (id: string | number, name: string) => {
    const associatedCustomersCount = customers.filter(c => String(c.vendorId) === String(id)).length;
    let html: React.ReactNode = <>Are you sure you want to delete the vendor "<strong>{name}</strong>"? This action cannot be undone.</>;

    if (associatedCustomersCount > 0) {
      html = (
        `
          <p>This vendor is currently assigned to <strong>${associatedCustomersCount} customer(s)</strong>.</p>
          <p class="mt-2 text-sm text-gray-500">Deleting "<strong>${name}</strong>" will leave these customer records without an assigned vendor. Are you sure you want to proceed?</p>
        `
      );
    }
    
    const result = await confirmDelete({
        title: 'Delete Vendor?',
        html: html,
    });
    
    if(result) {
        // Fix line 97: cast id to string
        deleteVendor(String(id));
        fireToast('success', `Vendor "${name}" deleted successfully.`);
    }
  }

  return (
    <PageContainer>
    <div className="container mx-auto">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Vendors</h2>
        {canCreate && (
            <button onClick={() => openVendorModal(null)} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 flex items-center">
                <i className="ri-add-line mr-2"></i>
                Add Vendor
            </button>
        )}
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('name')}>
                  <div className="flex items-center">Vendor Name {sortConfig?.key === 'name' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                </th>
                {(canUpdate || canDelete) && <th className="p-4 text-left text-sm font-semibold text-gray-600">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.map((vendor: Vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="p-4 whitespace-nowrap font-medium text-gray-900">{vendor.name}</td>
                  {(canUpdate || canDelete) && (
                    <td className="p-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-1">
                            {canUpdate && (
                                <Tooltip content="Edit Vendor">
                                    <button onClick={() => openVendorModal(vendor)} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-primary transition-colors">
                                        <i className="ri-pencil-fill text-base"></i>
                                    </button>
                                </Tooltip>
                            )}
                            {canDelete && (
                                <Tooltip content="Delete Vendor">
                                    <button onClick={() => handleDelete(vendor.id, vendor.name)} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-red-500 transition-colors">
                                        <i className="ri-delete-bin-5-fill text-base"></i>
                                    </button>
                                </Tooltip>
                            )}
                        </div>
                    </td>
                  )}
                </tr>
              ))}
               {paginatedData.length === 0 && (
                <tr><td colSpan={2} className="text-center py-10 text-gray-500">No vendors found.</td></tr>
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

export default VendorsPage;
