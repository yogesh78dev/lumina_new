
import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation, matchPath, useNavigate } from 'react-router-dom';
import LeadModal from '../leads/LeadModal';
import InvoiceModal from '../invoices/InvoiceModal';
import UserModal from '../users/UserModal';
import RoleModal from '../roles/RoleModal';
import VendorModal from '../vendors/VendorModal';
import { useCrm } from '../../hooks/useCrm';
import { usePermissions } from '../../hooks/usePermissions';
import { useSwal } from '../../hooks/useSwal';
import { Lead, Invoice, User, Role, Vendor } from '../../types';
import { capitalizeName } from '../../utils/formatters';
import NotificationPanel from './NotificationPanel';
import QuoteBuilderModal from '../quotes/QuoteBuilderModal';
import { generateAvatar } from '../../utils/avatar';
import CommandPalette from '../common/CommandPalette';
import Tooltip from '../common/Tooltip';
import ChatWidget from '../chat/ChatWidget';

const getTitleFromPathname = (pathname: string): string => {
  if (pathname === '/') return 'Dashboard';
  if (matchPath("/leads/:leadId", pathname)) return 'Lead Details';
  if (pathname === '/customers/new') return 'Create Customer';
  if (matchPath("/customers/:customerId/edit", pathname)) return 'Edit Customer';
  if (pathname === '/profile') return 'My Profile';
  if (pathname === '/chat') return 'Team Chat';
  if (pathname === '/settings/customization') return 'Customization Settings';

  // Capitalize path names like /settings/users/activity/user-1
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 1) {
    const title = segments[0].replace(/-/g, ' ');
    return title.charAt(0).toUpperCase() + title.slice(1);
  }

  const title = pathname.replace('/', '').replace('-', ' ');
  return title.charAt(0).toUpperCase() + title.slice(1);
}

const NavItem: React.FC<{
  to: string;
  icon: string;
  label: string;
  isCollapsed: boolean;
  badge?: number;
}> = ({ to, icon, label, isCollapsed, badge }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Exact match for dashboard, partial match for others to keep active state
  const isActive = to === '/' 
    ? location.pathname === '/' 
    : location.pathname.startsWith(to);

  const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation(); // Critical: Prevent event bubbling that might be caught by overlay/backdrop listeners
      navigate(to);
  };

  return (
    <div className="relative group">
      <Tooltip content={isCollapsed ? label : ''} position="right" className="w-full">
        <div
            onClick={handleClick}
            className={`w-full flex items-center px-4 py-2 my-1 text-sm font-medium transition-colors duration-200 transform rounded-md cursor-pointer ${
                isActive
                ? 'bg-primary text-white font-semibold'
                : 'text-slate-300 hover:bg-primary/80 hover:text-white'
            }`}
        >
            <div className="relative flex-shrink-0">
                <i className={`${icon} w-6 text-center text-xl`}></i>
                {/* Ensure badge > 0 to avoid rendering '0' text */}
                {badge !== undefined && badge > 0 && isCollapsed && (
                    <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-primary ring-2 ring-slate-900" />
                )}
            </div>
            {/* Using absolute positioning for text when collapsing to prevent layout shift/scroll */}
            <span className={`whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden flex items-center justify-between ${isCollapsed ? 'w-0 opacity-0 absolute left-10 pointer-events-none' : 'w-full ml-3 opacity-100 relative'}`}>
                {label}
                {badge !== undefined && badge > 0 && (
                    <span className="inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-bold leading-none text-white bg-primary rounded-full ml-2">
                        {badge > 9 ? '9+' : badge}
                    </span>
                )}
            </span>
        </div>
      </Tooltip>
    </div>
  );
};

const SidebarContent: React.FC<{ 
    isCollapsed: boolean;
    unreadChatCount: number;
    unassignedLeadsCount: number;
}> = ({ isCollapsed, unreadChatCount, unassignedLeadsCount }) => {
    const permissions = usePermissions();
    const { logout, companyDetails, currentUser } = useCrm();
    const navigate = useNavigate();
    
    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        logout();
        navigate('/login');
    }

    const logoUrl = companyDetails?.logoUrl || "https://www.luminainfotech.com/assets/img/logo.svg";
    const isSuperAdmin = currentUser?.role === 'Super Admin';

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-start h-16 border-b border-slate-800 flex-shrink-0 px-4">
                <img 
                    src={logoUrl} 
                    alt={companyDetails?.companyName || "CRM Logo"} 
                    className={`${isCollapsed ? 'h-8 w-8 mx-auto' : 'h-10 w-auto max-w-full'} object-contain rounded-md`} 
                />
            </div>
            
            <div className="flex-1 overflow-y-auto overflow-x-hidden thin-scrollbar">
                <nav className="px-2 py-4 space-y-1">
                    <NavItem to="/" icon="ri-pie-chart-2-line" label="Dashboard" isCollapsed={isCollapsed} />
                    {permissions.can('leads', 'read') && (
                        <NavItem 
                            to="/leads" 
                            icon="ri-group-2-line" 
                            label="Leads" 
                            isCollapsed={isCollapsed} 
                            badge={isSuperAdmin ? unassignedLeadsCount : undefined} 
                        />
                    )}
                    {permissions.can('customers', 'read') && <NavItem to="/customers" icon="ri-team-line" label="Customers" isCollapsed={isCollapsed} />}
                    {permissions.can('vendors', 'read') && <NavItem to="/vendors" icon="ri-store-2-line" label="Vendors" isCollapsed={isCollapsed} />}
                    {permissions.can('reminders', 'read') && <NavItem to="/reminders" icon="ri-notification-3-line" label="Reminders" isCollapsed={isCollapsed} />}
                    {permissions.can('invoices', 'read') && <NavItem to="/invoices" icon="ri-bill-line" label="Invoices" isCollapsed={isCollapsed} />}
                    {permissions.can('settings', 'read') && <NavItem to="/settings" icon="ri-settings-3-line" label="Settings" isCollapsed={isCollapsed} />}
                </nav>
            </div>
            
             <div className="px-2 py-2 flex-shrink-0 border-t border-slate-800/50">
                 {/* Team Chat - Placed separately in the footer area */}
                 <NavItem to="/chat" icon="ri-chat-3-line" label="Team Chat" isCollapsed={isCollapsed} badge={unreadChatCount} />
                 
                 <div className="relative group mt-1">
                    <Tooltip content={isCollapsed ? "Logout" : ''} position="right" className="w-full">
                        <button onClick={handleLogout} className="w-full flex items-center px-4 py-2 my-1 text-sm font-medium text-slate-300 transition-colors duration-200 transform rounded-md hover:bg-red-900/30 hover:text-red-400 cursor-pointer">
                            <i className="ri-logout-box-r-line w-6 text-center text-xl shrink-0"></i>
                            <span className={`whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'w-0 opacity-0 absolute left-10 pointer-events-none' : 'w-auto ml-3 opacity-100 relative'}`}>
                                Logout
                            </span>
                        </button>
                    </Tooltip>
                </div>
                 <div className={`px-4 pt-2 mt-2 border-t border-slate-800 text-left text-xs text-slate-500 transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100'}`}>
                    <p>&copy; {new Date().getFullYear()} <a href="https://www.luminainfotech.com/" target="_blank" rel="noopener noreferrer" className="hover:text-primary font-semibold">Lumina Infotech</a></p>
                 </div>
            </div>
        </div>
    );
}

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    isLeadModalOpen, closeLeadModal, editingLead, addLead, updateLead, openLeadModal,
    isInvoiceModalOpen, closeInvoiceModal, editingInvoice, addInvoice, updateInvoice,
    isUserModalOpen, closeUserModal, editingUser, addUser, updateUser,
    isRoleModalOpen, closeRoleModal, editingRole, addRole, updateRole,
    isVendorModalOpen, closeVendorModal, editingVendor, addVendor, updateVendor,
    isQuoteBuilderOpen,
    currentUser, logout, getTotalUnreadMessages, getUnreadNotificationCount, getUnassignedLeadsCount
  } = useCrm();
  const permissions = usePermissions();
  const { fireToast } = useSwal();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationPanelRef = useRef<HTMLDivElement>(null);

  const unreadChatCount = getTotalUnreadMessages();
  const unreadNotificationCount = getUnreadNotificationCount();
  const unassignedLeadsCount = getUnassignedLeadsCount();

  const showGlobalCreateButton = location.pathname !== '/leads';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
            setIsUserMenuOpen(false);
        }
        if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target as Node)) {
            setIsNotificationPanelOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Command Palette Shortcut (Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setIsCommandPaletteOpen(prev => !prev);
        }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSaveLead = async (leadData: Omit<Lead, 'id' | 'createdAt'> | Lead) => {
    const isUpdating = 'id' in leadData;
    try {
        if (isUpdating) {
          await updateLead(leadData as Lead);
        } else {
          await addLead(leadData);
        }
        closeLeadModal();
        fireToast('success', `Lead ${isUpdating ? 'updated' : 'created'} successfully!`);
    } catch (error: any) {
        fireToast('error', error.message || 'Failed to save lead.');
    }
  };
  
  const handleSaveAndNewLead = async (leadData: Omit<Lead, 'id' | 'createdAt'>) => {
      try {
          await addLead(leadData);
          fireToast('success', 'Lead created successfully!');
      } catch (error: any) {
          fireToast('error', error.message || 'Failed to save lead.');
      }
  };
  
  const handleSaveInvoice = async (invoiceData: Omit<Invoice, 'id'|'issuedDate'|'customerName'> | Invoice) => {
    const isUpdating = 'id' in invoiceData;
    try {
        if (isUpdating) {
          await updateInvoice(invoiceData);
        } else {
          await addInvoice(invoiceData);
        }
        closeInvoiceModal();
        fireToast('success', `Invoice ${isUpdating ? 'updated' : 'created'} successfully!`);
    } catch (error: any) {
        fireToast('error', error.message || 'Failed to save invoice.');
    }
  }

  const handleSaveUser = async (userData: Omit<User, 'id'> | User) => {
    const isUpdating = 'id' in userData;
    try {
        if (isUpdating) {
          await updateUser(userData);
        } else {
          await addUser(userData);
        }
        closeUserModal();
        fireToast('success', `User ${isUpdating ? 'updated' : 'created'} successfully!`);
    } catch (error: any) {
        fireToast('error', error.message || 'Failed to save user.');
    }
  }

  const handleSaveRole = async (roleData: Omit<Role, 'id'> | Role) => {
    const isUpdating = 'id' in roleData;
    try {
        if (isUpdating) {
          await updateRole(roleData);
        } else {
          await addRole(roleData);
        }
        closeRoleModal();
        fireToast('success', `Role ${isUpdating ? 'updated' : 'created'} successfully!`);
    } catch (error: any) {
        fireToast('error', error.message || 'Failed to save role.');
    }
  }
  
  const handleSaveVendor = async (vendorData: Omit<Vendor, 'id'> | Vendor) => {
    const isUpdating = 'id' in vendorData;
    try {
        if (isUpdating) {
            await updateVendor(vendorData);
        } else {
            await addVendor(vendorData);
        }
        closeVendorModal();
        fireToast('success', `Vendor ${isUpdating ? 'updated' : 'created'} successfully!`);
    } catch (error: any) {
        fireToast('error', error.message || 'Failed to save vendor.');
    }
  }

  if (!currentUser) return null;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden isolate">
       {/* Sidebar with EXTREME Z-index to ensure it stays above all content including ChatPage overlays */}
       <aside 
         className={`fixed top-0 left-0 z-[9999] h-screen transition-all duration-300 ease-in-out pointer-events-auto ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${isSidebarCollapsed ? 'w-20' : 'w-60'}`}
         style={{ isolation: 'isolate' }}
       >
         <div className="h-full bg-secondary border-r border-slate-800">
            <SidebarContent 
              isCollapsed={isSidebarCollapsed} 
              unreadChatCount={unreadChatCount}
              unassignedLeadsCount={unassignedLeadsCount}
            />
         </div>
      </aside>
      
      {/* Mobile Overlay */}
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="bg-gray-900 bg-opacity-50 fixed inset-0 z-[5000] md:hidden"></div>}

      <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-60'}`}>
        {/* Header with High Z-index */}
        <header className="flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b sticky top-0 z-[999] shrink-0">
            <div className="flex items-center min-w-0 shrink gap-3">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="md:hidden flex items-center justify-center w-10 h-10 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"
                    aria-label="Toggle menu"
                    aria-expanded={isSidebarOpen}
                >
                    <div className="w-5 h-4 flex flex-col justify-between">
                        <span className={`block h-0.5 w-full bg-current rounded-full transform transition duration-300 ease-in-out ${isSidebarOpen ? 'rotate-45 translate-y-[6px]' : ''}`} />
                        <span className={`block h-0.5 w-full bg-current rounded-full transition duration-300 ease-in-out ${isSidebarOpen ? 'opacity-0' : ''}`} />
                        <span className={`block h-0.5 w-full bg-current rounded-full transform transition duration-300 ease-in-out ${isSidebarOpen ? '-rotate-45 -translate-y-[6px]' : ''}`} />
                    </div>
                </button>
                 <button 
                    onClick={() => setIsSidebarCollapsed(p => !p)} 
                    className="hidden md:flex items-center justify-center w-10 h-10 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"
                    title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    <div className="w-5 h-4 flex flex-col justify-between">
                        <span className={`block h-0.5 w-full bg-current rounded-full transform transition duration-300 ease-in-out ${!isSidebarCollapsed ? 'rotate-45 translate-y-[6px]' : ''}`} />
                        <span className={`block h-0.5 w-full bg-current rounded-full transition duration-300 ease-in-out ${!isSidebarCollapsed ? 'opacity-0' : ''}`} />
                        <span className={`block h-0.5 w-full bg-current rounded-full transform transition duration-300 ease-in-out ${!isSidebarCollapsed ? '-rotate-45 -translate-y-[6px]' : ''}`} />
                    </div>
                </button>
                <div className="hidden sm:flex items-center">
                    <button 
                        onClick={() => setIsCommandPaletteOpen(true)}
                        className="flex items-center text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-gray-600 border border-gray-200 rounded-md px-3 py-1.5 transition-colors text-sm w-48 lg:w-64"
                    >
                        <i className="ri-search-line mr-2"></i>
                        <span>Search...</span>
                        <div className="ml-auto text-xs bg-white border border-gray-300 rounded px-1.5 py-0.5 text-gray-400 font-mono hidden lg:block">Ctrl K</div>
                    </button>
                </div>
                <h1 className="text-lg font-semibold truncate whitespace-nowrap overflow-hidden sm:hidden">{getTitleFromPathname(location.pathname)}</h1>
            </div>

           <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
                <button 
                    onClick={() => setIsCommandPaletteOpen(true)} 
                    className="sm:hidden w-10 h-10 flex items-center justify-center text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <i className="ri-search-line text-xl"></i>
                </button>

                {permissions.can('leads', 'create') && showGlobalCreateButton && (
                 <div className="relative group">
                   <button 
                    onClick={() => openLeadModal(null)} 
                    className="px-3 sm:px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 flex items-center"
                   >
                    <i className="ri-add-line text-lg sm:mr-2"></i>
                    <span className="hidden sm:inline">Create Lead</span>
                   </button>
                 </div>
                )}
                
                <div className="relative" ref={notificationPanelRef}>
                    <button onClick={() => setIsNotificationPanelOpen(p => !p)} className="relative w-10 h-10 flex items-center justify-center text-gray-500 rounded-full hover:bg-gray-100 transition-colors">
                        <i className="ri-notification-3-line text-xl"></i>
                        {unreadNotificationCount > 0 && (
                            <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white ring-2 ring-white">
                                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                            </span>
                        )}
                    </button>
                    {isNotificationPanelOpen && <NotificationPanel onClose={() => setIsNotificationPanelOpen(false)} />}
                </div>

                <div className="relative" ref={userMenuRef}>
                    <button onClick={() => setIsUserMenuOpen(p => !p)} className="flex items-center space-x-2">
                        <img src={currentUser.imageUrl || generateAvatar(currentUser.name)} alt={currentUser.name} className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-sm" />
                        <span className="hidden sm:inline font-medium text-sm text-gray-700">{capitalizeName(currentUser.name)}</span>
                        <i className={`ri-arrow-down-s-line text-gray-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}></i>
                    </button>
                    {isUserMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-[6000] border">
                            <div className="px-4 py-2 border-b">
                                <p className="text-sm font-semibold text-gray-800">{capitalizeName(currentUser.name)}</p>
                                <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                                <span className={`inline-block mt-2 px-2 py-0.5 text-xs font-semibold rounded-full ${currentUser.role === 'Super Admin' ? 'bg-primary/10 text-primary' : 'bg-blue-100 text-blue-800'}`}>{currentUser.role}</span>
                            </div>
                            <button 
                                onClick={(e) => { e.preventDefault(); setIsUserMenuOpen(false); navigate('/profile'); }} 
                                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                            >
                                My Profile
                            </button>
                            <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                                Logout
                            </button>
                        </div>
                    )}
                </div>
          </div>
        </header>
        {/* Main Content Area - Full height with hidden overflow. Z-0 to establish stacking context for children */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50 relative z-0">
          <Outlet />
        </main>
      </div>
       <LeadModal
        isOpen={isLeadModalOpen}
        onClose={closeLeadModal}
        onSave={handleSaveLead}
        onSaveAndNew={handleSaveAndNewLead}
        lead={editingLead}
      />
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={closeInvoiceModal}
        onSave={handleSaveInvoice}
        invoice={editingInvoice}
      />
      <UserModal
        isOpen={isUserModalOpen}
        onClose={closeUserModal}
        onSave={handleSaveUser}
        user={editingUser}
      />
      <RoleModal
        isOpen={isRoleModalOpen}
        onClose={closeRoleModal}
        onSave={handleSaveRole}
        role={editingRole}
      />
      <VendorModal
        isOpen={isVendorModalOpen}
        onClose={closeVendorModal}
        onSave={handleSaveVendor}
        vendor={editingVendor}
      />
      {isQuoteBuilderOpen && <QuoteBuilderModal />}
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
      <ChatWidget />
      
      <style>{`
        .thin-scrollbar::-webkit-scrollbar { width: 6px; }
        .thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .thin-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
        .thin-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
        .thin-scrollbar { scrollbar-width: thin; scrollbar-color: #d1d5db transparent; }
      `}</style>
    </div>
  );
};

export default Layout;
