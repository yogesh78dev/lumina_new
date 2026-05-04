
import React from 'react';
import { useCrm } from '../hooks/useCrm';
import { usePermissions } from '../hooks/usePermissions';
import { useSwal } from '../hooks/useSwal';
import { Link } from 'react-router-dom';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/common/Pagination';
import { Customer } from '../types';
import { capitalizeName } from '../utils/formatters';
import { useSorting } from '../hooks/useSorting';
import PageContainer from '../components/layout/PageContainer';
import Tooltip from '../components/common/Tooltip';

const CustomersPage: React.FC = () => {
  const { customers, users, deleteCustomer } = useCrm();
  const permissions = usePermissions();
  const { confirmDelete, fireToast } = useSwal();
  const canCreate = permissions.can('customers', 'create');
  const canUpdate = permissions.can('customers', 'update');
  const canDelete = permissions.can('customers', 'delete');

  const { items: sortedCustomers, requestSort, sortConfig } = useSorting<Customer>(customers, { key: 'createdAt', direction: 'descending' });

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
  } = usePagination(sortedCustomers, 10);

  const handleDelete = async (id: string | number, name: string) => {
    const result = await confirmDelete({
      title: 'Delete Customer?',
      html: <>Are you sure you want to delete customer "<strong>{name}</strong>"? This action cannot be undone.</>,
    });

    if (result) {
      await deleteCustomer(String(id));
      fireToast('success', `Customer "${name}" deleted successfully.`);
    }
  }
  
  const getUserName = (userId: string | number) => {
    const user = users.find(u => String(u.id) === String(userId));
    return user ? capitalizeName(user.name) : 'Unknown';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
        return new Date(dateStr).toLocaleDateString();
    } catch (e) {
        return 'Invalid Date';
    }
  }

  return (
    <PageContainer>
    <div className="container mx-auto">
      <header className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-wrap gap-4 justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800">Our Customers</h2>
            {canCreate && (
                <Link to="/customers/new" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 flex items-center">
                    <i className="ri-add-line mr-2"></i>
                    Create Customer
                </Link>
            )}
        </div>
      </header>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('customerId')}>
                  <div className="flex items-center">Customer ID {sortConfig?.key === 'customerId' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('name')}>
                  <div className="flex items-center">Name {sortConfig?.key === 'name' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">Contact</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('serviceType')}>
                  <div className="flex items-center">Service Type {sortConfig?.key === 'serviceType' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('saleById')}>
                  <div className="flex items-center">Sale By {sortConfig?.key === 'saleById' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('closeDate')}>
                  <div className="flex items-center">Close Date {sortConfig?.key === 'closeDate' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                </th>
                {(canUpdate || canDelete) && <th className="p-4 text-left text-sm font-semibold text-gray-600">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.map((customer: Customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="p-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                    {customer.customerId || `C-00${customer.id}`}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{customer.name}</div>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <div className="text-sm text-gray-800">{customer.email || '-'}</div>
                    <div className="text-sm text-gray-500">{customer.phone}</div>
                  </td>
                  <td className="p-4 whitespace-nowrap text-sm text-gray-600">{customer.serviceType || '-'}</td>
                  <td className="p-4 whitespace-nowrap text-sm text-primary font-medium">{getUserName(customer.saleById)}</td>
                  <td className="p-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(customer.closeDate)}
                  </td>
                  {(canUpdate || canDelete) && (
                    <td className="p-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-1">
                            {canUpdate && (
                                <Tooltip content="Edit Customer">
                                    <Link to={`/customers/${customer.id}/edit`} className="w-8 h-8 flex items-center justify-center text-gray-500 rounded-full hover:bg-gray-100 hover:text-primary transition-colors">
                                        <i className="ri-pencil-fill text-base"></i>
                                    </Link>
                                </Tooltip>
                            )}
                            {canDelete && (
                                <Tooltip content="Delete Customer">
                                    <button onClick={() => handleDelete(customer.id, customer.name)} className="w-8 h-8 flex items-center justify-center text-gray-500 rounded-full hover:bg-gray-100 hover:text-red-500 transition-colors">
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
                <tr><td colSpan={7} className="text-center py-10 text-gray-500">No customers found.</td></tr>
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

export default CustomersPage;
