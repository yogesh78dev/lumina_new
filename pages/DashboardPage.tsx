
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useCrm } from '../hooks/useCrm';
import { InvoiceStatus } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { capitalizeName } from '../utils/formatters';
import { generateAvatar } from '../utils/avatar';
import PageContainer from '../components/layout/PageContainer';

// Access the global Chart object from the script tag in index.html
declare const Chart: any;

const DashboardPage: React.FC = () => {
  const { leads, customers, invoices, currentUser, leadReminders, leadStatuses, leadSources, users, openLeadModal, openInvoiceModal, openUserModal } = useCrm();
  const [timeFilter, setTimeFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  
  const leadStatusChartRef = useRef<HTMLCanvasElement>(null);
  const leadSourceChartRef = useRef<HTMLCanvasElement>(null);
  const revenueChartRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  const isAdminOrSuperAdmin = currentUser && ['Admin', 'Super Admin', 'Manager'].includes(currentUser.role);

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
    const now = new Date();
    const timeLimit = new Date();
    let applyTimeFilter = true;

    if (timeFilter === '7') {
      timeLimit.setDate(now.getDate() - 7);
    } else if (timeFilter === '30') {
      timeLimit.setDate(now.getDate() - 30);
    } else if (timeFilter === '90') {
      timeLimit.setDate(now.getDate() - 90);
    } else {
      applyTimeFilter = false;
    }

    const filteredLeads = leads.filter(lead => {
      const isAfterTimeLimit = applyTimeFilter ? new Date(lead.createdAt) >= timeLimit : true;
      const matchesAgent = agentFilter === 'all' || lead.assignedToId === agentFilter;
      const matchesSource = sourceFilter === 'all' || lead.leadSource === sourceFilter;
      return isAfterTimeLimit && matchesAgent && matchesSource;
    });

    const filteredCustomers = customers.filter(customer => {
      const isAfterTimeLimit = applyTimeFilter ? new Date(customer.closeDate) >= timeLimit : true;
      const matchesAgent = agentFilter === 'all' || customer.saleById === agentFilter;
      return isAfterTimeLimit && matchesAgent;
    });

    const filteredInvoices = invoices.filter(invoice => {
      const isAfterTimeLimit = applyTimeFilter ? new Date(invoice.issuedDate) >= timeLimit : true;
      const customer = customers.find(c => c.id === invoice.customerId);
      const matchesAgent = agentFilter === 'all' || (customer && customer.saleById === agentFilter);
      return isAfterTimeLimit && matchesAgent;
    });

    return { filteredLeads, filteredInvoices, filteredCustomers };
  }, [leads, invoices, customers, timeFilter, agentFilter, sourceFilter]);


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
            count: filteredData.filteredLeads.filter(lead => lead.leadStatus === status.name).length
        }));
        
        const statusColors = ['#c4161c', '#f59e0b', '#22c55e', '#6b7280', '#8b5cf6', '#3b82f6'];

        const ctx = leadStatusChartRef.current.getContext('2d');
        if (ctx) {
            const chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: leadCountsByStatus.map(s => s.name),
                    datasets: [{
                        label: 'Leads',
                        data: leadCountsByStatus.map(s => s.count),
                        backgroundColor: statusColors, 
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
            .reduce((sum, inv) => sum + inv.amount, 0);
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
  const newLeadsCount = filteredData.filteredLeads.filter(l => l.leadStatus === 'New Lead').length;
  const followUpCount = filteredData.filteredLeads.filter(l => l.leadStatus === 'Follow-up').length;
  const totalCustomers = filteredData.filteredCustomers.length;
  const totalRevenue = filteredData.filteredInvoices
    .filter(i => i.status === InvoiceStatus.PAID)
    .reduce((sum, i) => sum + i.amount, 0);
  
  // Tasks needing attention (Due Today or Overdue)
  const todaysTasks = useMemo(() => {
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today

      return leadReminders.filter(r => {
          if(r.isCompleted) return false;
          // Filter by agent if selected
          if(agentFilter !== 'all') {
              const lead = leads.find(l => l.id === r.leadId);
              if(lead?.assignedToId !== agentFilter) return false;
          }
          const dueDate = new Date(r.dueDate);
          return dueDate <= today;
      }).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 15);
  }, [leadReminders, leads, agentFilter]);

  // Agent Performance Logic
  const agentPerformance = useMemo(() => {
    return users.map(user => {
        // Filter leads based on the current View (which is already scoped by Context)
        // If current user is Agent, filteredData.filteredLeads only contains THEIR leads.
        const userLeads = filteredData.filteredLeads.filter(l => l.assignedToId === user.id);
        const total = userLeads.length;
        const won = userLeads.filter(l => l.leadStatus === 'Won').length;
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

  return (
    <PageContainer>
      <div className="space-y-6 max-w-[1600px] mx-auto">
        
        {/* 1. Header Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div className="flex flex-col gap-2 flex-grow">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-800">
                        {getGreeting()}, <span className="text-primary">{capitalizeName(currentUser.name.split(' ')[0])}</span>
                    </h1>
                    <span className="text-2xl animate-pulse">👋</span>
                </div>
                <p className="text-gray-500 font-medium">Here's what's happening in your agency today.</p>
            </div>

            <div className="flex flex-col items-end gap-6 min-w-fit w-full xl:w-auto">
                {/* Filters */}
                <div className="flex gap-3 w-full xl:w-auto flex-wrap sm:flex-nowrap">
                    <div className="relative group flex-grow sm:w-40">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-primary transition-colors">
                            <i className="ri-calendar-line text-lg"></i>
                        </div>
                        <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="w-full appearance-none bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block pl-10 pr-8 py-2.5 cursor-pointer hover:border-gray-300 transition-colors shadow-sm">
                            <option value="all">All Time</option>
                            <option value="30">Last 30 Days</option>
                            <option value="7">Last 7 Days</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <i className="ri-arrow-down-s-line text-lg"></i>
                        </div>
                    </div>

                    {isAdminOrSuperAdmin && (
                        <div className="relative group flex-grow sm:w-48">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-primary transition-colors">
                                <i className="ri-user-line text-lg"></i>
                            </div>
                            <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className="w-full appearance-none bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block pl-10 pr-8 py-2.5 cursor-pointer hover:border-gray-300 transition-colors shadow-sm">
                                <option value="all">All Agents</option>
                                {users.map(u => <option key={u.id} value={u.id}>{capitalizeName(u.name)}</option>)}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <i className="ri-arrow-down-s-line text-lg"></i>
                            </div>
                        </div>
                    )}

                    {isAdminOrSuperAdmin && (
                        <div className="relative group flex-grow sm:w-48">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-primary transition-colors">
                                <i className="ri-links-line text-lg"></i>
                            </div>
                            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="w-full appearance-none bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block pl-10 pr-8 py-2.5 cursor-pointer hover:border-gray-300 transition-colors shadow-sm">
                                <option value="all">All Sources</option>
                                {leadSources.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <i className="ri-arrow-down-s-line text-lg"></i>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* 2. Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

                    {isAdminOrSuperAdmin && (
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
                {isAdminOrSuperAdmin && (
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
