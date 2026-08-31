
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useCrm } from '../hooks/useCrm';
import { InvoiceStatus } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { capitalizeName } from '../utils/formatters';
import { generateAvatar } from '../utils/avatar';
import PageContainer from '../components/layout/PageContainer';

// Access the global Chart object from the script tag in index.html
declare const Chart: any;

const getRecordDateOnly = (dateValue?: string) => {
  if (!dateValue) return '';
  return String(dateValue).slice(0, 10);
};

const isDateWithinRange = (dateValue: string | undefined, fromDate: string, toDate: string) => {
  const dateOnly = getRecordDateOnly(dateValue);
  if (!dateOnly) return false;
  if (fromDate && dateOnly < fromDate) return false;
  if (toDate && dateOnly > toDate) return false;
  return true;
};

const getDateDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

const isUnassignedValue = (value: unknown) => {
  const normalizedValue = String(value ?? '').trim().toLowerCase();
  return !normalizedValue || normalizedValue === '0' || normalizedValue === 'null' || normalizedValue === 'undefined';
};

const normalizeStatusName = (statusName?: string) => (
  String(statusName || '')
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
);

const toMoneyNumber = (value: unknown) => {
  const normalized = Number(String(value ?? 0).replace(/,/g, ''));
  return Number.isFinite(normalized) ? normalized : 0;
};

const DashboardPage: React.FC = () => {
  const { leads, customers, invoices, currentUser, leadReminders, leadStatuses, leadSources, users, openLeadModal, openInvoiceModal, openUserModal } = useCrm();
  const [timeFilter, setTimeFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  const leadStatusChartRef = useRef<HTMLCanvasElement>(null);
  const leadSourceChartRef = useRef<HTMLCanvasElement>(null);
  const revenueChartRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  const isSuperAdmin = currentUser && String(currentUser.role).toLowerCase() === 'super admin';

  // Time and Date State
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000); // Update every minute is enough for greeting
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hours = currentDate.getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const filteredData = useMemo(() => {
    let fromDateLimit = '';
    let applyTimeFilter = true;
    const applyCustomDateRange = Boolean(fromDate || toDate);

    if (applyCustomDateRange) {
      applyTimeFilter = false;
    } else if (timeFilter === '7') {
      fromDateLimit = getDateDaysAgo(7);
    } else if (timeFilter === '30') {
      fromDateLimit = getDateDaysAgo(30);
    } else if (timeFilter === '90') {
      fromDateLimit = getDateDaysAgo(90);
    } else {
      applyTimeFilter = false;
    }

    const filteredLeads = leads.filter(lead => {
      const dashboardDate = lead.createdAt;
      const isAfterTimeLimit = applyTimeFilter ? isDateWithinRange(dashboardDate, fromDateLimit, '') : true;
      const isWithinCustomRange = applyCustomDateRange ? isDateWithinRange(dashboardDate, fromDate, toDate) : true;
      const matchesAgent = agentFilter === 'all' || (agentFilter === 'unassigned' ? isUnassignedValue(lead.assignedToId) : String(lead.assignedToId) === String(agentFilter));
      const matchesSource = sourceFilter === 'all' || lead.leadSource === sourceFilter;
      return isAfterTimeLimit && isWithinCustomRange && matchesAgent && matchesSource;
    });

    const filteredCustomers = customers.filter(customer => {
      const isAfterTimeLimit = applyTimeFilter ? isDateWithinRange(customer.closeDate, fromDateLimit, '') : true;
      const isWithinCustomRange = applyCustomDateRange ? isDateWithinRange(customer.closeDate, fromDate, toDate) : true;
      const matchesAgent = agentFilter === 'all' || (agentFilter === 'unassigned' ? false : String(customer.saleById) === String(agentFilter));
      return isAfterTimeLimit && isWithinCustomRange && matchesAgent;
    });

    const filteredInvoices = invoices.filter(invoice => {
      const isAfterTimeLimit = applyTimeFilter ? isDateWithinRange(invoice.issuedDate, fromDateLimit, '') : true;
      const customer = customers.find(c => c.id === invoice.customerId);
      const isWithinCustomRange = applyCustomDateRange ? isDateWithinRange(invoice.issuedDate, fromDate, toDate) : true;
      const matchesAgent = agentFilter === 'all' || (agentFilter === 'unassigned' ? false : (customer && String(customer.saleById) === String(agentFilter)));
      return isAfterTimeLimit && isWithinCustomRange && matchesAgent;
    });

    return { filteredLeads, filteredInvoices, filteredCustomers };
  }, [leads, invoices, customers, timeFilter, agentFilter, sourceFilter, fromDate, toDate]);


  useEffect(() => {
    // Safety check: ensure Chart is loaded
    if (typeof Chart === 'undefined') return;

    Chart.defaults.font.family = "'Poppins', sans-serif";
    Chart.defaults.color = '#6b7280';

    const chartInstances: any[] = [];
    
    // Lead Status Chart (Bar)
    if (leadStatusChartRef.current) {
        const leadCountsByStatus = leadStatuses.map(status => ({
            name: status.name,
            count: filteredData.filteredLeads.filter(lead => normalizeStatusName(lead.leadStatus) === normalizeStatusName(status.name)).length,
            color: status.color || '#2563eb'
        }));

        const ctx = leadStatusChartRef.current.getContext('2d');
        if (ctx) {
            const chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: leadCountsByStatus.map(s => s.name),
                    datasets: [{
                        label: 'Leads',
                        data: leadCountsByStatus.map(s => s.count),
                        backgroundColor: leadCountsByStatus.map(s => s.color), 
                        borderRadius: 4,
                        barThickness: 30,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { display: false },
                    },
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            grid: { color: '#f3f4f6', drawBorder: false },
                            ticks: { font: { size: 10 } }
                        },
                        x: { 
                            grid: { display: false },
                            ticks: { font: { size: 10 } }
                        }
                    }
                }
            });
            chartInstances.push(chart);
        }
    }

    // Lead Source Chart (Doughnut)
    if (leadSourceChartRef.current) {
        const leadCountsBySource = leadSources.map(source => ({
            name: source.name,
            count: filteredData.filteredLeads.filter(l => l.leadSource === source.name).length
        })).filter(s => s.count > 0); // Only show sources with data
        
        const sourceColors = ['#c4161c', '#ea580c', '#ca8a04', '#16a34a', '#2563eb', '#9333ea', '#db2777', '#4b5563', '#0891b2', '#7c3aed'];

        const ctx = leadSourceChartRef.current.getContext('2d');
        if (ctx) {
            const chart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: leadCountsBySource.map(s => s.name),
                    datasets: [{
                        data: leadCountsBySource.map(s => s.count),
                        backgroundColor: sourceColors,
                        borderColor: '#ffffff',
                        borderWidth: 2,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%', 
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: { boxWidth: 10, padding: 10, font: { size: 10 } }
                        },
                        title: { display: false }
                    }
                }
            });
            chartInstances.push(chart);
        }
    }
    
    // Revenue Chart (Line)
    if (revenueChartRef.current) {
        const last6Months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return { month: d.toLocaleString('default', { month: 'short' }), year: d.getFullYear() };
        }).reverse();

        const revenueByMonth = last6Months.map(m => {
            return filteredData.filteredInvoices
            .filter(inv => {
                const invDate = new Date(inv.issuedDate);
                return inv.status === InvoiceStatus.PAID && invDate.toLocaleString('default', { month: 'short' }) === m.month && invDate.getFullYear() === m.year;
            })
            .reduce((sum, inv) => sum + toMoneyNumber(inv.amount), 0);
        });

        const ctx = revenueChartRef.current.getContext('2d');
        if(ctx) {
            const gradient = ctx.createLinearGradient(0, 0, 0, 250);
            gradient.addColorStop(0, 'rgba(196, 22, 28, 0.2)'); // Red tint
            gradient.addColorStop(1, 'rgba(196, 22, 28, 0)');

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: last6Months.map(m => m.month),
                    datasets: [{
                        label: 'Revenue',
                        data: revenueByMonth,
                        fill: true,
                        backgroundColor: gradient,
                        borderColor: '#c4161c', // Primary Red
                        tension: 0.4,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#c4161c',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            grid: { color: '#f3f4f6', drawBorder: false },
                            ticks: { callback: (val: any) => '₹' + val, font: { size: 10 } }
                        },
                        x: { grid: { display: false }, ticks: { font: { size: 10 } } }
                    }
                }
            });
            chartInstances.push(chart);
        }
    }

    return () => {
      chartInstances.forEach(chart => chart.destroy());
    };
  }, [filteredData, leadStatuses, leadSources]);

  if (!currentUser) return null;

  // Stats calculation
  const newLeadsCount = filteredData.filteredLeads.filter(l => normalizeStatusName(l.leadStatus) === 'new lead').length;
  const followUpCount = filteredData.filteredLeads.filter(l => normalizeStatusName(l.leadStatus) === 'follow up').length;
  const unassignedLeadsCount = filteredData.filteredLeads.filter(l => isUnassignedValue(l.assignedToId)).length;
  const totalCustomers = filteredData.filteredCustomers.length;
  const totalRevenue = filteredData.filteredInvoices
    .filter(i => i.status === InvoiceStatus.PAID)
    .reduce((sum, i) => sum + toMoneyNumber(i.amount), 0);
  
  // Tasks needing attention (Due Today or Overdue)
  const todaysTasks = useMemo(() => {
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today

      return leadReminders.filter(r => {
          if(r.isCompleted) return false;
          const lead = leads.find(l => String(l.id) === String(r.leadId));
          if (!lead) return false;
          if (!filteredData.filteredLeads.some(filteredLead => String(filteredLead.id) === String(lead.id))) return false;
          const dueDate = new Date(r.dueDate);
          return dueDate <= today;
      }).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 15);
  }, [leadReminders, leads, filteredData.filteredLeads]);

  // Agent Performance Logic
  const agentPerformance = useMemo(() => {
    return users.map(user => {
        // Filter leads based on the current View (which is already scoped by Context)
        // If current user is Agent, filteredData.filteredLeads only contains THEIR leads.
        const userLeads = filteredData.filteredLeads.filter(l => String(l.assignedToId) === String(user.id));
        const total = userLeads.length;
        const won = userLeads.filter(l => normalizeStatusName(l.leadStatus) === 'won').length;
        const conversion = total > 0 ? Math.round((won / total) * 100) : 0;
        return { ...user, total, won, conversion };
    })
    .filter(u => u.total > 0) // Only show agents with leads
    .sort((a, b) => b.won - a.won)
    .slice(0, 5); // Top 5
  }, [users, filteredData.filteredLeads]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
  };

  const handleDateRangeChange = (field: 'from' | 'to', value: string) => {
    if (field === 'from') {
      setFromDate(value);
    } else {
      setToDate(value);
    }
    if (value) {
      setTimeFilter('all');
    }
  };

  const clearDateRange = () => {
    setFromDate('');
    setToDate('');
  };

  return (
    <PageContainer>
      <div className="space-y-6 max-w-[1600px] mx-auto">
        
        {/* 1. Header Section */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5">
            <div className="flex flex-col gap-2 flex-grow">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-800">
                        {getGreeting()}, <span className="text-primary">{capitalizeName(currentUser.name.split(' ')[0])}</span>
                    </h1>
                    <span className="text-2xl animate-pulse">👋</span>
                </div>
                <p className="text-gray-500 font-medium">Here's what's happening in your agency today.</p>
            </div>

            <div className="w-full xl:w-auto xl:max-w-[980px]">
                {/* Filters */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-2 shadow-inner">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative group flex h-10 min-w-[190px] flex-1 items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-primary/30 sm:flex-none">
                        <span className="flex h-full items-center gap-1.5 border-r border-slate-100 bg-slate-50 px-3 text-[11px] font-black uppercase tracking-wide text-slate-500">
                            <i className="ri-calendar-line text-sm text-slate-400"></i>
                            Range
                        </span>
                        <select id="dashboard-time-filter" value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="h-full min-w-0 flex-1 appearance-none bg-white px-3 pr-8 text-sm font-semibold text-slate-700 outline-none cursor-pointer">
                          <option value="all">All Time</option>
                          <option value="30">Last 30 Days</option>
                          <option value="7">Last 7 Days</option>
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <i className="ri-arrow-down-s-line text-lg"></i>
                        </div>
                    </div>

                    <div className="group flex h-10 min-w-[180px] flex-1 items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-primary/30 sm:flex-none">
                        <span className="flex h-full items-center gap-1.5 border-r border-slate-100 bg-slate-50 px-3 text-[11px] font-black uppercase tracking-wide text-slate-500">
                            <i className="ri-calendar-event-line text-sm text-slate-400"></i>
                            From
                        </span>
                        <input
                            id="dashboard-from-date"
                            type="date"
                            value={fromDate}
                            max={toDate || undefined}
                            onChange={(e) => handleDateRangeChange('from', e.target.value)}
                            className="h-full min-w-0 flex-1 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
                            title="From Date"
                        />
                    </div>

                    <div className="group flex h-10 min-w-[180px] flex-1 items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-primary/30 sm:flex-none">
                        <span className="flex h-full items-center gap-1.5 border-r border-slate-100 bg-slate-50 px-3 text-[11px] font-black uppercase tracking-wide text-slate-500">
                            <i className="ri-calendar-check-line text-sm text-slate-400"></i>
                            To
                        </span>
                        <input
                            id="dashboard-to-date"
                            type="date"
                            value={toDate}
                            min={fromDate || undefined}
                            onChange={(e) => handleDateRangeChange('to', e.target.value)}
                            className="h-full min-w-0 flex-1 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
                            title="To Date"
                        />
                    </div>

                    {isSuperAdmin && (
                        <div className="relative group flex h-10 min-w-[190px] flex-1 items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-primary/30 sm:flex-none">
                            <span className="flex h-full items-center gap-1.5 border-r border-slate-100 bg-slate-50 px-3 text-[11px] font-black uppercase tracking-wide text-slate-500">
                                <i className="ri-user-line text-sm text-slate-400"></i>
                                Agent
                            </span>
                            <select id="dashboard-agent-filter" value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className="h-full min-w-0 flex-1 appearance-none bg-white px-3 pr-8 text-sm font-semibold text-slate-700 outline-none cursor-pointer">
                                <option value="all">All Agents</option>
                                <option value="unassigned">Unassigned</option>
                                {users.map(u => <option key={u.id} value={u.id}>{capitalizeName(u.name)}</option>)}
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <i className="ri-arrow-down-s-line text-lg"></i>
                            </div>
                        </div>
                    )}

                    {isSuperAdmin && (
                        <div className="relative group flex h-10 min-w-[190px] flex-1 items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-primary/30 sm:flex-none">
                            <span className="flex h-full items-center gap-1.5 border-r border-slate-100 bg-slate-50 px-3 text-[11px] font-black uppercase tracking-wide text-slate-500">
                                <i className="ri-links-line text-sm text-slate-400"></i>
                                Source
                            </span>
                            <select id="dashboard-source-filter" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="h-full min-w-0 flex-1 appearance-none bg-white px-3 pr-8 text-sm font-semibold text-slate-700 outline-none cursor-pointer">
                                <option value="all">All Sources</option>
                                {leadSources.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <i className="ri-arrow-down-s-line text-lg"></i>
                            </div>
                        </div>
                    )}

                    {(fromDate || toDate) && (
                        <button
                            type="button"
                            onClick={clearDateRange}
                            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3 text-xs font-black uppercase tracking-wide text-primary transition-colors hover:bg-primary/10 sm:flex-none"
                        >
                            <i className="ri-close-circle-line text-sm"></i>
                            Clear
                        </button>
                    )}
                  </div>
                </div>
            </div>
        </div>

        {/* 2. Stats Cards */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isSuperAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-6`}>
            {isSuperAdmin && (
                <Link to="/leads?status=Unassigned" className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i className="ri-user-shared-line text-6xl text-red-500"></i>
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Unassigned</p>
                        <div className="flex items-baseline gap-2 mt-2">
                            <h3 className="text-4xl font-extrabold text-gray-800">{unassignedLeadsCount}</h3>
                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Action!</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Leads waiting to be assigned</p>
                    </div>
                </Link>
            )}
            <Link to="/leads?status=New Lead" className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <i className="ri-user-add-fill text-6xl text-primary"></i>
                </div>
                <div className="relative z-10">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">New Leads</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <h3 className="text-4xl font-extrabold text-gray-800">{newLeadsCount}</h3>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">↑ 12%</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Fresh inquiries awaiting response</p>
                </div>
            </Link>

            <Link to="/leads?status=Follow-up" className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <i className="ri-phone-fill text-6xl text-amber-500"></i>
                </div>
                <div className="relative z-10">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Follow Ups</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <h3 className="text-4xl font-extrabold text-gray-800">{followUpCount}</h3>
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">● Pending</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Active conversations in progress</p>
                </div>
            </Link>

            <Link to="/customers" className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <i className="ri-briefcase-fill text-6xl text-emerald-500"></i>
                </div>
                <div className="relative z-10">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Customers</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <h3 className="text-4xl font-extrabold text-gray-800">{totalCustomers}</h3>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">↑ 5%</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Closed deals and active clients</p>
                </div>
            </Link>

            <Link to="/invoices" className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <i className="ri-money-dollar-circle-fill text-6xl text-purple-500"></i>
                </div>
                <div className="relative z-10">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Revenue</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <h3 className="text-4xl font-extrabold text-gray-800">₹{totalRevenue.toLocaleString()}</h3>
                        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Stable</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Generated from paid invoices</p>
                </div>
            </Link>
        </div>

        {/* MAIN SPLIT LAYOUT */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
            
            {/* Left Column: Actions & Analytics (66%) */}
            <div className="xl:col-span-2 space-y-8">
                
                {/* 3. Horizontal Quick Actions - Restored Colorful Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onClick={() => openLeadModal(null)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group flex items-center gap-3 text-left">
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <i className="ri-user-add-line"></i>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-sm">Add Lead</h4>
                            <p className="text-[10px] text-gray-500">Create prospect</p>
                        </div>
                    </button>

                    <button onClick={() => openInvoiceModal(null)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-purple-200 transition-all group flex items-center gap-3 text-left">
                        <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <i className="ri-file-add-line"></i>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-sm">Create Invoice</h4>
                            <p className="text-[10px] text-gray-500">Bill a client</p>
                        </div>
                    </button>

                    {isSuperAdmin && (
                        <button onClick={() => openUserModal(null)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-orange-200 transition-all group flex items-center gap-3 text-left">
                            <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center text-xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                <i className="ri-user-settings-line"></i>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 text-sm">Add User</h4>
                                <p className="text-[10px] text-gray-500">Team member</p>
                            </div>
                        </button>
                    )}
                </div>

                {/* 4. Analytics Row: Pipeline & Sources */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex flex-col h-80">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Lead Pipeline</h3>
                        <div className="flex-grow relative w-full h-full min-h-0">
                            <canvas ref={leadStatusChartRef}></canvas>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex flex-col h-80">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Lead Sources</h3>
                        {/* FIX: Removed flex centering and added fixed relative container to prevent overflow */}
                        <div className="flex-grow relative w-full min-h-0">
                            <canvas ref={leadSourceChartRef}></canvas>
                        </div>
                    </div>
                </div>

                {/* 5. Revenue Chart - Full width of left col */}
                <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Revenue Performance</h3>
                    <div className="relative h-64 w-full">
                        <canvas ref={revenueChartRef}></canvas>
                    </div>
                </div>
            </div>

            {/* Right Column: Work & Performance (33%) */}
            <div className="xl:col-span-1 space-y-8">
                
                {/* 6. Today's Tasks - Priority #1 Visibility */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex flex-col h-[550px]">
                     <div className="p-5 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 text-lg">Upcoming Reminders</h3>
                        <Link to="/reminders" className="text-xs font-semibold text-primary hover:underline">View All</Link>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto p-4 space-y-3 thin-scrollbar">
                        {todaysTasks.length > 0 ? (
                            todaysTasks.map(task => {
                                const isOverdue = new Date(task.dueDate) < new Date();
                                const lead = leads.find(l => l.id === task.leadId);
                                return (
                                    <div 
                                        key={task.id} 
                                        onClick={() => lead ? navigate(`/leads/${lead.id}`) : null}
                                        className={`p-3 rounded-xl border border-gray-100 hover:border-amber-300 hover:bg-amber-50/50 transition-all group relative bg-white shadow-sm ${lead ? 'cursor-pointer' : ''}`}
                                    >
                                        {/* Status Badge */}
                                        <div className="flex justify-between items-start mb-2">
                                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {isOverdue ? 'Overdue' : 'Due Today'}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-mono">{formatTime(task.dueDate)}</span>
                                        </div>
                                        
                                        <p className="text-sm font-medium text-gray-800 line-clamp-2 mb-2">{task.note}</p>
                                        
                                        {lead && (
                                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                                <div className="text-xs font-semibold text-gray-600 group-hover:text-primary flex items-center gap-1 truncate max-w-[120px]">
                                                    <i className="ri-user-line"></i> {lead.name}
                                                </div>
                                                <div className="flex gap-2">
                                                    <a 
                                                        href={`tel:${lead.phone}`} 
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors" 
                                                        title="Call"
                                                    >
                                                        <i className="ri-phone-fill text-xs"></i>
                                                    </a>
                                                    <a 
                                                        href={`https://wa.me/${lead.phone}`} 
                                                        target="_blank" 
                                                        rel="noreferrer" 
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-6 h-6 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition-colors" 
                                                        title="WhatsApp"
                                                    >
                                                        <i className="ri-whatsapp-fill text-xs"></i>
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-3 text-2xl animate-pulse">
                                    <i className="ri-cup-line"></i>
                                </div>
                                <p className="text-sm font-medium text-gray-600">All caught up!</p>
                                <p className="text-xs mt-1">Enjoy your day.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 7. Top Performers */}
                {isSuperAdmin && (
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 text-lg">Agent Performance</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            {agentPerformance.length > 0 ? (
                                agentPerformance.map((agent, index) => (
                                    <div key={agent.id} className="flex items-center gap-3">
                                        <div className={`w-6 text-center font-bold text-sm ${index === 0 ? 'text-yellow-500 text-lg' : index === 1 ? 'text-gray-400 text-base' : index === 2 ? 'text-orange-400 text-base' : 'text-gray-300'}`}>
                                            #{index + 1}
                                        </div>
                                        <img src={agent.imageUrl || generateAvatar(agent.name)} alt={agent.name} className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm" />
                                        <div className="flex-grow min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="text-sm font-semibold text-gray-800 truncate">{capitalizeName(agent.name)}</p>
                                                <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 rounded">{agent.won} Won</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                <div className="bg-gradient-to-r from-primary to-red-400 h-1.5 rounded-full" style={{ width: `${agent.conversion}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-6">No performance data yet.</p>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>

      </div>
    </PageContainer>
  );
};

export default DashboardPage;
