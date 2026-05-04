
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCrm } from '../hooks/useCrm';
import { usePermissions } from '../hooks/usePermissions';
import { useSwal } from '../hooks/useSwal';
import { Invoice, InvoiceStatus } from '../types';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/common/Pagination';
import { useSorting } from '../hooks/useSorting';
import PageContainer from '../components/layout/PageContainer';
import Tooltip from '../components/common/Tooltip';

const TABS = ['All', ...Object.values(InvoiceStatus)];

const InvoicesPage: React.FC = () => {
  const { invoices, openInvoiceModal, deleteInvoice } = useCrm();
  const permissions = usePermissions();
  const { confirmDelete, fireToast } = useSwal();
  const [searchParams, setSearchParams] = useSearchParams();
  const canCreate = permissions.can('invoices', 'create');
  const canUpdate = permissions.can('invoices', 'update');
  const canDelete = permissions.can('invoices', 'delete');

  const activeStatus = searchParams.get('status') || TABS[0];

  const filteredInvoices = useMemo(() => {
    if (activeStatus === 'All') return invoices;
    return invoices.filter(invoice => invoice.status === activeStatus);
  }, [invoices, activeStatus]);

  const { items: sortedInvoices, requestSort, sortConfig } = useSorting<Invoice>(filteredInvoices, { key: 'issuedDate', direction: 'descending'});

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
  } = usePagination(sortedInvoices, 10);

  const getStatusClass = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID:
        return 'bg-green-100 text-green-800';
      case InvoiceStatus.SENT:
        return 'bg-blue-100 text-blue-800';
      case InvoiceStatus.OVERDUE:
        return 'bg-primary/10 text-primary';
      case InvoiceStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      default:
        return '';
    }
  };

  const handleDelete = async (id: string | number) => {
    // FIX line 129: cast id to string to use toUpperCase
    const idStr = String(id);
    const result = await confirmDelete({
        title: 'Delete Invoice?',
        html: <>Are you sure you want to delete invoice <strong>{idStr.toUpperCase()}</strong>? This action cannot be undone.</>,
    });
    if (result) {
      // FIX line 151: cast id to string
      deleteInvoice(idStr);
      fireToast('success', `Invoice ${idStr.toUpperCase()} deleted successfully.`);
    }
  };
  
  const tabClass = (status: string) => 
    `px-4 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors duration-200 ${
      activeStatus === status 
      ? 'bg-primary text-white shadow-sm' 
      : 'text-gray-600 hover:bg-gray-200'
    }`;

  return (
    <PageContainer>
    <div className="container mx-auto">
      <header className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-wrap gap-y-4 justify-between items-center">
          <div className="flex items-center p-1 bg-gray-100 rounded-lg flex-wrap">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setSearchParams({ status: tab })} className={tabClass(tab)}>
                {tab}
              </button>
            ))}
          </div>
          {canCreate && (
              <button onClick={() => openInvoiceModal(null)} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 flex items-center">
                  <i className="ri-add-line mr-2"></i>
                  Create Invoice
              </button>
          )}
        </div>
      </header>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('id')}>
                  <div className="flex items-center">Invoice ID {sortConfig?.key === 'id' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('customerName')}>
                  <div className="flex items-center">Customer {sortConfig?.key === 'customerName' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('amount')}>
                  <div className="flex items-center">Amount {sortConfig?.key === 'amount' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('issuedDate')}>
                  <div className="flex items-center">Issued Date {sortConfig?.key === 'issuedDate' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('dueDate')}>
                  <div className="flex items-center">Due Date {sortConfig?.key === 'dueDate' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                </th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('status')}>
                  <div className="flex items-center">Status {sortConfig?.key === 'status' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                </th>
                {(canUpdate || canDelete) && <th className="p-4 text-left text-sm font-semibold text-gray-600">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.map((invoice: Invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="p-4 whitespace-nowrap font-mono text-sm text-gray-500">{String(invoice.id).toUpperCase()}</td>
                  <td className="p-4 whitespace-nowrap font-medium text-gray-900">{invoice.customerName}</td>
                  <td className="p-4 whitespace-nowrap text-gray-800">₹{invoice.amount.toLocaleString()}</td>
                  <td className="p-4 whitespace-nowrap text-gray-600">{new Date(invoice.issuedDate).toLocaleDateString()}</td>
                  <td className="p-4 whitespace-nowrap text-gray-600">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                  <td className="p-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  {(canUpdate || canDelete) && (
                    <td className="p-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-1">
                            {canUpdate && (
                                <Tooltip content="Edit Invoice">
                                    <button onClick={() => openInvoiceModal(invoice)} className="w-8 h-8 flex items-center justify-center text-gray-500 rounded-full hover:bg-gray-100 hover:text-primary transition-colors">
                                        <i className="ri-pencil-fill text-base"></i>
                                    </button>
                                </Tooltip>
                            )}
                            {canDelete && (
                                <Tooltip content="Delete Invoice">
                                    <button onClick={() => handleDelete(invoice.id)} className="w-8 h-8 flex items-center justify-center text-gray-500 rounded-full hover:bg-gray-100 hover:text-red-500 transition-colors">
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
                <tr><td colSpan={8} className="text-center py-10 text-gray-500">No invoices found for this status.</td></tr>
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

export default InvoicesPage;
