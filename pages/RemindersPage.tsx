
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCrm } from '../hooks/useCrm';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/common/Pagination';
import { LeadReminder } from '../types';
import { useSorting } from '../hooks/useSorting';
import PageContainer from '../components/layout/PageContainer';

interface ReminderWithLeadInfo extends LeadReminder {
  leadName: string;
}

const RemindersPage: React.FC = () => {
  const { leadReminders, leads, toggleReminderCompletion } = useCrm();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');

  const remindersWithLeadInfo = useMemo((): ReminderWithLeadInfo[] => {
    return leadReminders.map(reminder => {
      const lead = leads.find(l => String(l.id) === String(reminder.leadId));
      return { ...reminder, leadName: lead?.name || 'Unknown Lead' };
    });
  }, [leadReminders, leads]);
  
  const { items: sortedReminders, requestSort, sortConfig } = useSorting<ReminderWithLeadInfo>(remindersWithLeadInfo, { key: 'dueDate', direction: 'ascending'});

  const upcomingReminders = useMemo(() => {
    return sortedReminders.filter(r => !r.isCompleted);
  }, [sortedReminders]);

  const completedReminders = useMemo(() => {
    return sortedReminders.filter(r => r.isCompleted);
  }, [sortedReminders]);

  const remindersToPaginate = activeTab === 'upcoming' ? upcomingReminders : completedReminders;

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
  } = usePagination(remindersToPaginate, 10);

  const tabClass = (tabName: 'upcoming' | 'completed') =>
    `px-4 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors duration-200 ${
      activeTab === tabName
        ? 'bg-primary text-white shadow-sm'
        : 'text-gray-600 hover:bg-gray-200'
    }`;
    
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <PageContainer>
    <div className="container mx-auto">
      <header className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-800">Reminders</h2>
          <div className="flex items-center p-1 bg-gray-100 rounded-lg">
            <button onClick={() => setActiveTab('upcoming')} className={tabClass('upcoming')}>
              Upcoming ({upcomingReminders.length})
            </button>
            <button onClick={() => setActiveTab('completed')} className={tabClass('completed')}>
              Completed ({completedReminders.length})
            </button>
          </div>
        </div>
      </header>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                 <thead className="bg-gray-50">
                    <tr>
                        <th className="p-4 w-10 text-left font-semibold text-gray-600">Status</th>
                        <th className="p-4 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('note')}>
                          <div className="flex items-center">Note {sortConfig?.key === 'note' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                        </th>
                        <th className="p-4 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('leadName')}>
                          <div className="flex items-center">Lead {sortConfig?.key === 'leadName' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                        </th>
                        <th className="p-4 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('dueDate')}>
                          <div className="flex items-center">Due Date {sortConfig?.key === 'dueDate' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {paginatedData.map((reminder: ReminderWithLeadInfo) => (
                         <tr key={reminder.id} className={`hover:bg-gray-50 ${reminder.isCompleted ? 'opacity-60' : ''}`}>
                             <td className="p-4 text-center">
                                 <input
                                    type="checkbox"
                                    checked={reminder.isCompleted}
                                    // FIX line 108: cast reminder.id to string
                                    onChange={() => toggleReminderCompletion(String(reminder.id))}
                                    title={reminder.isCompleted ? "Mark as not completed" : "Mark as completed"}
                                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                />
                             </td>
                             <td className="p-4">
                                 <p className={`font-medium text-gray-800 ${reminder.isCompleted ? 'line-through' : ''}`}>{reminder.note}</p>
                             </td>
                             <td className="p-4">
                                 <Link to={`/leads/${reminder.leadId}`} className="text-primary hover:underline">
                                    {reminder.leadName}
                                 </Link>
                             </td>
                             <td className="p-4 text-gray-600">
                                {formatDate(reminder.dueDate)}
                             </td>
                         </tr>
                    ))}
                    {paginatedData.length === 0 && (
                        <tr>
                            <td colSpan={4} className="text-center py-10 text-gray-500">
                                No {activeTab} reminders found.
                            </td>
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
    </PageContainer>
  );
};

export default RemindersPage;
