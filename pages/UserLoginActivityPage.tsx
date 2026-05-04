
import React, { useMemo, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCrm } from '../hooks/useCrm';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/common/Pagination';
import { UserActivityLog, User } from '../types';
import { capitalizeName } from '../utils/formatters';
import { useSorting } from '../hooks/useSorting';
import PageContainer from '../components/layout/PageContainer';

const UserLoginActivityPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const { getUserActivityLogs, fetchUserActivityLogs, users } = useCrm();
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (userId) {
            setIsFetching(true);
            fetchUserActivityLogs(userId).finally(() => setIsFetching(false));
        }
    }, [userId, fetchUserActivityLogs]);

    const user = useMemo(() => users.find(u => String(u.id) === String(userId)), [users, userId]);
    const userLogs = useMemo(() => {
        if (!userId) return [];
        return getUserActivityLogs(userId);
    }, [userId, getUserActivityLogs]);
    
    const { items: sortedLogs, requestSort, sortConfig } = useSorting<UserActivityLog>(userLogs, { key: 'loginDate', direction: 'descending'});

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
    } = usePagination(sortedLogs, 10);

    if (!user) {
        return (
            <div className="text-center p-8">
                <h2 className="text-xl font-semibold">User not found</h2>
                <Link to="/settings" className="text-primary hover:underline mt-4 inline-block">Go back to settings</Link>
            </div>
        );
    }
    
    return (
        <PageContainer>
        <div className="container mx-auto">
            <div className="mb-4">
                 <Link to="/settings" className="text-primary hover:underline text-sm flex items-center">
                    <i className="ri-arrow-left-line mr-2"></i>
                    Back to Settings
                </Link>
            </div>
            <header className="bg-white p-4 rounded-lg shadow-md mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-800">User Login Activity: {capitalizeName(user.name)}</h2>
                {isFetching && <i className="ri-loader-4-line animate-spin text-primary text-xl"></i>}
            </header>
             <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600">ID</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600">Name</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600">Role</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('ipAddress')}>
                                  <div className="flex items-center">IP Address {sortConfig?.key === 'ipAddress' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                                </th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600">User Agent</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('loginDate')}>
                                  <div className="flex items-center">Login Time {sortConfig?.key === 'loginDate' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                                </th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('location')}>
                                  <div className="flex items-center">Location {sortConfig?.key === 'location' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                                </th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('status')}>
                                  <div className="flex items-center">Status {sortConfig?.key === 'status' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                             {paginatedData.map((log: UserActivityLog, index) => (
                                <tr key={log.id} className="hover:bg-gray-50 text-sm">
                                    <td className="p-3 whitespace-nowrap">{startIndex + index}</td>
                                    <td className="p-3 whitespace-nowrap">{capitalizeName(user.name)}</td>
                                    <td className="p-3 whitespace-nowrap">{user.role}</td>
                                    <td className="p-3 whitespace-nowrap font-mono">{log.ipAddress}</td>
                                    <td className="p-3 whitespace-nowrap">
                                        <span title={log.userAgent} className="text-xs text-gray-500">{log.userAgent.substring(0, 40)}...</span>
                                    </td>
                                    <td className="p-3 whitespace-nowrap text-xs">{new Date(log.loginDate).toLocaleString()}</td>
                                    <td className="p-3 whitespace-nowrap">{log.location}</td>
                                    <td className="p-3 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${log.status === 'Logged In' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {paginatedData.length === 0 && !isFetching && (
                                <tr><td colSpan={8} className="text-center py-10 text-gray-500">No activity logs found for this user.</td></tr>
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

export default UserLoginActivityPage;
