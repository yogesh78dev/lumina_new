
import React, { useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Lead, Customer, Invoice, User, Role, Vendor, LeadNote, LeadReminder, LeadDocument,
  CompanyDetails, EmailApiCredentials, MobileApiCredentials, DocumentStatus,
  SystemLog, PermissionCategory, PermissionSection, ImportedFile, Announcement,
  Target, Notification, Email, WhatsAppMessage, Quote, WorkflowRule,
  SaleBy, WorkedBy, LeadStatus, LeadSource, ApplicationStatusItem, PassportStatusItem,
  DocumentType, RemarkStatus, ServiceType, LostReason, LeadCategory,
  UserActivityLog, ChatMessage, CallLog, PaymentGatewaySettings
} from '../types';
import * as MockData from '../services/mockData';
import { api } from '../services/api';
import { CrmContext, CrmContextType } from './CrmContextCore';

export const CrmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('crm_currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [leadNotes, setLeadNotes] = useState<LeadNote[]>([]);
  const [leadReminders, setLeadReminders] = useState<LeadReminder[]>([]);
  const [leadDocuments, setLeadDocuments] = useState<LeadDocument[]>([]);
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails>(MockData.mockCompanyDetails);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [leadStatuses, setLeadStatuses] = useState<LeadStatus[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [leadCategories, setLeadCategories] = useState<LeadCategory[]>([]);
  const [applicationStatuses, setApplicationStatuses] = useState<ApplicationStatusItem[]>([]);
  const [passportStatuses, setPassportStatuses] = useState<PassportStatusItem[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [remarkStatuses, setRemarkStatuses] = useState<RemarkStatus[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [lostReasons, setLostReasons] = useState<LostReason[]>([]);
  const [saleBy, setSaleBy] = useState<SaleBy[]>([]);
  const [workedBy, setWorkedBy] = useState<WorkedBy[]>([]);
  const [publicConfigLoading, setPublicConfigLoading] = useState(true);

  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [isQuoteBuilderOpen, setIsQuoteBuilderOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [currentLeadIdForQuote, setCurrentLeadIdForQuote] = useState<string | null>(null);

  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [userActivityLogs, setUserActivityLogs] = useState<UserActivityLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [workflowRules, setWorkflowRules] = useState<WorkflowRule[]>([]);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowRule | null>(null);
  const [permissionCategories, setPermissionCategories] = useState<PermissionCategory[]>([]);
  const [permissionSections, setPermissionSections] = useState<PermissionSection[]>([]);
  const [importedLeadFiles, setImportedLeadFiles] = useState<ImportedFile[]>([]);
  const [importedContactFiles, setImportedContactFiles] = useState<ImportedFile[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [emailApiCredentials, setEmailApiCredentials] = useState<EmailApiCredentials>(MockData.mockEmailApiCredentials);
  const [mobileApiCredentials, setMobileApiCredentials] = useState<MobileApiCredentials>(MockData.mockMobileApiCredentials);
  const [paymentGatewaySettings, setPaymentGatewaySettings] = useState<PaymentGatewaySettings | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [whatsappMessages, setWhatsAppMessages] = useState<WhatsAppMessage[]>([]);
  const [activeCall, setActiveCall] = useState<CrmContextType['activeCall']>(null);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);

  const fetchChatMessages = useCallback(async () => {
    if (!currentUser) return;
    try {
      const chatData = await api.chat.getAllMessages();
      setMessages(chatData);
    } catch (err) {
      console.error('Failed to sync chat messages:', err);
    }
  }, [currentUser]);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
        const notifData = await api.notifications.getAll();
        setNotifications(notifData);
    } catch (err) {
        console.error('Failed to sync notifications:', err);
    }
  }, [currentUser]);

  const leadsRef = React.useRef(leads);
  const customersRef = React.useRef(customers);
  useEffect(() => { leadsRef.current = leads; }, [leads]);
  useEffect(() => { customersRef.current = customers; }, [customers]);

  /**
   * Application Handshake
   * Refactored to avoid clearing state during refreshes.
   */
  const fetchData = useCallback(async () => {
    if (!localStorage.getItem('crm_token')) return;

    // Only show global loading spinner if we don't have core data yet
    const hasData = leadsRef.current.length > 0 || customersRef.current.length > 0;
    if (!hasData) {
        setIsLoading(true);
    }

    try {
      const [leadsData, customersData, invoicesData, configData, targetData, logData, importHistory, remindersData] = await Promise.all([
        api.leads.getAll(),
        api.customers.getAll(),
        api.invoices.getAll(),
        api.config.init(),
        api.targets.getAll(),
        api.logs.getSystem(),
        api.data.getImportHistory(),
        api.leads.getAllReminders()
      ]);
      
      setLeads(leadsData);
      setCustomers(customersData);
      setInvoices(invoicesData);
      setUsers(configData.users);
      setRoles(configData.roles);
      setVendors(configData.vendors);
      setLeadSources(configData.leadSources);
      setLeadStatuses(configData.leadStatuses);
      setLeadCategories(configData.leadCategories || []);
      setApplicationStatuses(configData.applicationStatuses);
      setPassportStatuses(configData.passportStatuses);
      setDocumentTypes(configData.documentTypes);
      setRemarkStatuses(configData.remarkStatuses || []);
      setServiceTypes(configData.serviceTypes || []);
      setLostReasons(configData.lostReasons || []);
      setSaleBy(configData.saleBy || []);
      setWorkedBy(configData.workedBy || []);
      setTargets(targetData);
      setSystemLogs(logData);
      setImportedLeadFiles(importHistory);
      setLeadReminders(remindersData);
      setAnnouncements(configData.announcements || []);
      setWorkflowRules(configData.workflowRules || []);
      setPermissionCategories(configData.permissionCategories || []);
      setPermissionSections(configData.permissionSections || []);
      
      if (configData.companyDetails) setCompanyDetails(configData.companyDetails);
      if (configData.emailApiCredentials) setEmailApiCredentials(configData.emailApiCredentials);
      if (configData.mobileApiCredentials) setMobileApiCredentials(configData.mobileApiCredentials);
      if (configData.paymentGatewaySettings) setPaymentGatewaySettings(configData.paymentGatewaySettings);

      // Async fetch non-critical components
      fetchChatMessages();
      fetchNotifications();
      
    } catch (err) {
      console.error('Data sync failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchChatMessages, fetchNotifications]);

  const fetchPublicConfig = useCallback(async () => {
    try {
        const publicConfig = await api.config.getPublicConfig();
        if (publicConfig) {
            setCompanyDetails(prev => ({ ...prev, ...publicConfig }));
        }
    } catch (err) {
        console.error('Public config fetch failed:', err);
    } finally {
        setPublicConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicConfig();
  }, [fetchPublicConfig]);

  // Handle Favicon and Title Sync
  useEffect(() => {
    if (companyDetails.companyName) {
        document.title = `${companyDetails.companyName} | Enterprise CRM`;
    }
    if (companyDetails.faviconUrl) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'shortcut icon';
            document.head.appendChild(link);
        }
        link.href = companyDetails.faviconUrl;
    }
  }, [companyDetails.companyName, companyDetails.faviconUrl]);

  // Only trigger fetchData when the logged-in User ID changes (identity),
  // not when any property of the user (like imageUrl) changes.
  useEffect(() => { 
    if (currentUser?.id) fetchData(); 
  }, [currentUser?.id, fetchData]);

  useEffect(() => {
    if (!currentUser) return;
    const pollId = setInterval(() => {
        fetchChatMessages();
        fetchNotifications();
    }, 3000); // 3s for better real-time feel
    return () => clearInterval(pollId);
  }, [currentUser, fetchChatMessages, fetchNotifications]);

  // Call Timer Effect
  useEffect(() => {
    let interval: any;
    if (activeCall && activeCall.status === 'connected') {
      interval = setInterval(() => {
        setActiveCall((prev: any) => prev ? { ...prev, duration: Math.floor((Date.now() - prev.startTime) / 1000) } : null);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeCall?.status]);

  const login = useCallback(async (email: string, password?: string) => {
    try {
        const res = await api.auth.login({ email, password });
        if (res.success && res.token) {
            localStorage.setItem('crm_token', res.token);
            localStorage.setItem('crm_currentUser', JSON.stringify(res.user));
            setCurrentUser(res.user);
            return true;
        }
        return false;
    } catch (err) { return false; }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_currentUser');
    setCurrentUser(null);
  }, []);

  const openLeadModal = useCallback((lead: Lead | null) => { setEditingLead(lead); setIsLeadModalOpen(true); }, []);
  const closeLeadModal = useCallback(() => setIsLeadModalOpen(false), []);

  const addLead = useCallback(async (data: any) => { await api.leads.create(data); await fetchData(); }, [fetchData]);
  
  const updateLead = useCallback(async (data: Lead) => { 
    const oldLeads = [...leads];
    setLeads(prev => prev.map(l => String(l.id) === String(data.id) ? { ...l, ...data } : l));
    
    try {
        await api.leads.update(data.id, data); 
        await fetchData(); 
    } catch (err) {
        setLeads(oldLeads);
        throw err;
    }
  }, [fetchData, leads]);

  const deleteLead = useCallback(async (id: string | number) => {
      await api.leads.delete(id);
      await fetchData();
  }, [fetchData]);

  const bulkAssignLeads = useCallback(async (ids: any[], userId: any) => { await api.leads.bulkAssign(ids, userId); await fetchData(); }, [fetchData]);
  const bulkDeleteLeads = useCallback(async (ids: any[]) => { await api.leads.bulkDelete(ids); await fetchData(); }, [fetchData]);
  const bulkUpdateLeadStatus = useCallback(async (ids: any[], status: string) => { await api.leads.bulkStatus(ids, status); await fetchData(); }, [fetchData]);
  const convertLeadToCustomer = useCallback(async (lead: Lead) => { 
    await api.leads.convert(lead.id, {
        customerIdString: `CUST-${Date.now()}`,
        saleById: currentUser?.id || lead.assignedToId,
        closeDate: new Date().toISOString().split('T')[0]
    });
    await fetchData();
  }, [currentUser?.id, fetchData]);

  const addCustomer = useCallback(async (data: any) => { await api.customers.create(data); await fetchData(); }, [fetchData]);
  const updateCustomer = useCallback(async (data: Customer) => { await api.customers.update(data.id, data); await fetchData(); }, [fetchData]);
  const deleteCustomer = useCallback(async (id: any) => { await api.customers.delete(id); await fetchData(); }, [fetchData]);

  const addInvoice = useCallback(async (data: any) => { await api.invoices.create(data); await fetchData(); }, [fetchData]);
  
  const updateInvoice = useCallback(async (data: Invoice) => { 
    const oldInvoices = [...invoices];
    const customer = customers.find(c => String(c.id) === String(data.customerId));
    const updatedInvoice = { ...data, customerName: customer?.name || data.customerName };
    setInvoices(prev => prev.map(inv => String(inv.id) === String(data.id) ? updatedInvoice : inv));

    try {
        await api.invoices.update(data.id, data); 
        await fetchData(); 
    } catch (err) {
        setInvoices(oldInvoices);
        throw err;
    }
  }, [customers, fetchData, invoices]);

  const deleteInvoice = useCallback(async (id: any) => { await api.invoices.delete(id); await fetchData(); }, [fetchData]);

  const addUser = useCallback(async (data: any) => { await api.users.create(data); await fetchData(); }, [fetchData]);
  const updateUser = useCallback(async (data: User) => { await api.users.update(data.id, data); await fetchData(); }, [fetchData]);
  const deleteUser = useCallback(async (id: any) => { await api.users.delete(id); await fetchData(); }, [fetchData]);

  const updateProfile = useCallback(async (userId: string | number, data: Partial<User>) => { 
    try {
        await api.users.update(userId, data); 
        
        // Critically update the global state if editing own profile
        if (String(userId) === String(currentUser?.id)) {
            setCurrentUser(prev => {
                if (!prev) return null;
                const newUser = { ...prev, ...data };
                localStorage.setItem('crm_currentUser', JSON.stringify(newUser));
                return newUser;
            });
        }
        
        // Refresh silently to avoid blank table issues
        await fetchData(); 
    } catch (err) {
        console.error('Failed to update profile:', err);
        throw err;
    }
  }, [currentUser?.id, fetchData]);

  const getUserActivityLogs = useCallback((userId: any) => userActivityLogs.filter(l => String(l.userId) === String(userId)), [userActivityLogs]);
  
  const fetchUserActivityLogs = useCallback(async (userId: string | number) => {
    try {
        const logs = await api.logs.getUserActivity(userId);
        setUserActivityLogs(prev => [...prev.filter(l => String(l.userId) !== String(userId)), ...logs]);
    } catch (err) {
        console.error('Failed to fetch user activity logs:', err);
    }
  }, []);

  const fetchLeadActivities = useCallback(async (leadId: string | number) => {
    try {
        const [notes, reminders, docs, leadQuotes, logs] = await Promise.all([
            api.leads.getNotes(leadId),
            api.leads.getReminders(leadId),
            api.leads.getDocuments(leadId),
            api.quotes.getByLead(leadId),
            api.communications.getCallLogs(leadId)
        ]);
        setLeadNotes(prev => [...prev.filter(n => String(n.leadId) !== String(leadId)), ...notes]);
        setLeadReminders(prev => [...prev.filter(r => String(r.leadId) !== String(leadId)), ...reminders]);
        setLeadDocuments(prev => [...prev.filter(d => String(d.leadId) !== String(leadId)), ...docs]);
        setQuotes(prev => [...prev.filter(q => String(q.leadId) !== String(leadId)), ...leadQuotes]);
        setCallLogs(prev => [...prev.filter(l => String(l.leadId) !== String(leadId)), ...logs]);
    } catch (err) {
        console.error('Failed to fetch lead activities:', err);
    }
  }, []);

  const getNotesForLead = useCallback((leadId: string | number) => leadNotes.filter(n => String(n.leadId) === String(leadId)), [leadNotes]);
  
  const addNoteForLead = useCallback(async (leadId: any, content: string) => {
    if (!currentUser) return;
    await api.leads.addNote(leadId, { content, author: currentUser.name });
    await Promise.all([
        fetchLeadActivities(leadId),
        fetchData()
    ]);
  }, [currentUser, fetchData, fetchLeadActivities]);
  
  const updateNote = useCallback(async (id: any, content: string) => {
    const note = leadNotes.find(n => String(n.id) === String(id));
    if(!note) return;
    await api.leads.updateNote(note.leadId, id, { content });
    await Promise.all([
        fetchLeadActivities(note.leadId),
        fetchData()
    ]);
  }, [fetchData, fetchLeadActivities, leadNotes]); 
  
  const deleteNote = useCallback(async (id: any, noteId: any) => {
    const note = leadNotes.find(n => String(n.id) === String(noteId));
    if(!note) return;
    await api.leads.deleteNote(note.leadId, noteId);
    await Promise.all([
        fetchLeadActivities(note.leadId),
        fetchData()
    ]);
  }, [fetchData, fetchLeadActivities, leadNotes]);

  const getRemindersForLead = useCallback((leadId: string | number) => leadReminders.filter(r => String(r.leadId) === String(leadId)), [leadReminders]);
  
  const addReminderForLead = useCallback(async (leadId: any, note: string, dueDate: string) => {
    await api.leads.addReminder(leadId, { note, dueDate });
    await Promise.all([
        fetchLeadActivities(leadId),
        fetchData()
    ]);
  }, [fetchData, fetchLeadActivities]);
  
  const updateReminder = useCallback(async (id: any, note: string, dueDate: string) => {
    const rem = leadReminders.find(r => String(r.id) === String(id));
    if(!rem) return;
    await api.leads.updateReminder(rem.leadId, id, { note, dueDate });
    await fetchLeadActivities(rem.leadId);
  }, [fetchLeadActivities, leadReminders]);
  
  const deleteReminder = useCallback(async (id: any, reminderId: any) => {
    const rem = leadReminders.find(r => String(r.id) === String(reminderId));
    if(!rem) return;
    await api.leads.deleteReminder(rem.leadId, reminderId);
    await Promise.all([
        fetchLeadActivities(rem.leadId),
        fetchData()
    ]);
  }, [fetchData, fetchLeadActivities, leadReminders]);
  
  const toggleReminderCompletion = useCallback(async (id: any) => {
    const rem = leadReminders.find(r => String(r.id) === String(id));
    await api.leads.toggleReminder(id);
    if (rem) {
        await Promise.all([
            fetchLeadActivities(rem.leadId),
            fetchData()
        ]);
    }
  }, [fetchData, fetchLeadActivities, leadReminders]);

  const getDocumentsForLead = useCallback((leadId: string | number) => leadDocuments.filter(d => String(d.leadId) === String(leadId)), [leadDocuments]);
  const addDocumentForLead = useCallback(async (leadId: any, name: string) => {
    await api.leads.addDocument(leadId, { name, status: 'Pending' });
    await fetchLeadActivities(leadId);
  }, [fetchLeadActivities]);
  const updateDocumentStatus = useCallback(async (leadId: any, docId: any, status: DocumentStatus, fileName?: string, fileType?: string, fileData?: string) => {
    await api.leads.updateDocument(leadId, docId, { status, fileName, fileType, fileData });
    await fetchLeadActivities(leadId);
  }, [fetchLeadActivities]);
  const deleteDocumentForLead = useCallback(async (leadId: any, docId: any) => {
    await api.leads.deleteDocument(leadId, docId);
    setLeadDocuments(prev => prev.filter(d => String(d.id) !== String(docId)));
  }, []);

  const sendMessage = useCallback(async (receiverId: any, content: string) => {
    if (!currentUser) return;
    const tempId = uuidv4();
    const newMessage: ChatMessage = { id: tempId, senderId: currentUser.id, receiverId, content, timestamp: new Date().toISOString(), isRead: false };
    setMessages(prev => [...prev, newMessage]);
    try {
        await api.chat.sendMessage({ receiverId, content });
        fetchChatMessages();
    } catch (err) {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        throw err;
    }
  }, [currentUser, fetchChatMessages]);

  const getMessagesWithUser = useCallback((userId: any) => {
      if (!currentUser) return [];
      const currentId = String(currentUser.id);
      const otherId = String(userId);
      return messages.filter(m => (String(m.senderId) === currentId && String(m.receiverId) === otherId) || (String(m.senderId) === otherId && String(m.receiverId) === currentId));
  }, [currentUser, messages]);

  const markMessagesAsRead = useCallback(async (userId: string | number) => {
    if (!currentUser) return;
    const currentId = String(currentUser.id);
    const senderId = String(userId);
    setMessages(prev => prev.map(m => (String(m.senderId) === senderId && String(m.receiverId) === currentId) ? { ...m, isRead: true } : m));
    try {
        await api.chat.markRead(senderId);
    } catch (err) {
        console.error('Failed to mark chat as read:', err);
    }
  }, [currentUser]);

  const openVendorModal = useCallback((v: Vendor | null) => { setEditingVendor(v); setIsVendorModalOpen(true); }, []);
  const closeVendorModal = useCallback(() => setIsVendorModalOpen(false), []);
  const addVendor = useCallback(async (data: any) => { await api.vendors.create(data); await fetchData(); }, [fetchData]);
  const updateVendor = useCallback(async (data: Vendor) => { await api.vendors.update(data.id, data); await fetchData(); }, [fetchData]);
  const deleteVendor = useCallback(async (id: any) => { await api.vendors.delete(id); await fetchData(); }, [fetchData]);

  const openRoleModal = useCallback((r: Role | null) => { setEditingRole(r); setIsRoleModalOpen(true); }, []);
  const closeRoleModal = useCallback(() => setIsRoleModalOpen(false), []);
  const addRole = useCallback(async (data: any) => { await api.users.createRole(data); await fetchData(); }, [fetchData]);
  const updateRole = useCallback(async (data: Role) => { await api.users.updateRole(data.id, data); await fetchData(); }, [fetchData]);
  const deleteRole = useCallback(async (id: any) => { await api.users.deleteRole(id); await fetchData(); }, [fetchData]);

  const getQuotesForLead = useCallback((leadId: any) => quotes.filter(q => String(q.leadId) === String(leadId)), [quotes]);
  const openQuoteBuilder = useCallback((leadId: any, quote?: Quote | null) => { setCurrentLeadIdForQuote(String(leadId)); setEditingQuote(quote || null); setIsQuoteBuilderOpen(true); }, []);
  const closeQuoteBuilder = useCallback(() => setIsQuoteBuilderOpen(false), []);
  const addQuote = useCallback(async (leadId: any, quote: any) => { 
    await api.quotes.create({ ...quote, leadId, quoteNumber: `QT-${Date.now()}` }); 
    const qData = await api.quotes.getByLead(leadId);
    setQuotes(prev => [...prev.filter(q => String(q.leadId) !== String(leadId)), ...qData]);
  }, []);
  const updateQuote = useCallback(async (quote: Quote) => { 
    await api.quotes.update(quote.id, quote); 
    const qData = await api.quotes.getByLead(quote.leadId);
    setQuotes(prev => [...prev.filter(q => String(q.leadId) !== String(quote.leadId)), ...qData]);
  }, []);

  const updateCompanyDetails = useCallback(async (details: CompanyDetails) => { await api.config.updateCompany(details); await fetchData(); }, [fetchData]);
  const updateEmailApiCredentials = useCallback(async (creds: EmailApiCredentials) => { await api.config.updateEmailCredentials(creds); await fetchData(); }, [fetchData]);
  const updateMobileApiCredentials = useCallback(async (creds: MobileApiCredentials) => { await api.config.updateMobileCredentials(creds); await fetchData(); }, [fetchData]);

  const addSaleBy = useCallback(async (data: any) => { await api.master.create('sale-by', data); await fetchData(); }, [fetchData]);
  const updateSaleBy = useCallback(async (data: SaleBy) => { await api.master.update('sale-by', data.id, data); await fetchData(); }, [fetchData]);
  const deleteSaleBy = useCallback(async (id: any) => { await api.master.delete('sale-by', id); await fetchData(); }, [fetchData]);
  const addWorkedBy = useCallback(async (data: any) => { await api.master.create('worked-by', data); await fetchData(); }, [fetchData]);
  const updateWorkedBy = useCallback(async (data: WorkedBy) => { await api.master.update('worked-by', data.id, data); await fetchData(); }, [fetchData]);
  const deleteWorkedBy = useCallback(async (id: any) => { await api.master.delete('worked-by', id); await fetchData(); }, [fetchData]);

  const markNotificationAsRead = useCallback(async (id: any) => { 
    await api.notifications.markAsRead(id);
    setNotifications(prev => prev.map(n => String(n.id) === String(id) ? { ...n, isRead: true } : n)); 
  }, []);
  const markAllNotificationsAsRead = useCallback(async () => {
    await api.notifications.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);
  const addAnnouncement = useCallback(async (announcement: Omit<Announcement, 'id' | 'authorId' | 'createdAt'>) => {
    await api.settings.announcements.create(announcement);
    await fetchData();
  }, [fetchData]);

  const deleteAnnouncement = useCallback(async (id: string | number) => {
    await api.settings.announcements.delete(String(id));
    await fetchData();
  }, [fetchData]);

  const openWorkflowModal = useCallback((rule: WorkflowRule | null) => { setEditingWorkflow(rule); setIsWorkflowModalOpen(true); }, []);
  const closeWorkflowModal = useCallback(() => setIsWorkflowModalOpen(false), []);
  
  const addWorkflowRule = useCallback(async (rule: Omit<WorkflowRule, 'id'>) => {
    await api.settings.workflows.create(rule);
    await fetchData();
  }, [fetchData]);

  const updateWorkflowRule = useCallback(async (rule: WorkflowRule) => {
    await api.settings.workflows.update(rule.id, rule);
    await fetchData();
  }, [fetchData]);

  const deleteWorkflowRule = useCallback(async (id: any) => {
    await api.settings.workflows.delete(id);
    await fetchData();
  }, [fetchData]);

  const addPermissionCategory = useCallback(async (category: Omit<PermissionCategory, 'id'>) => {
    await api.settings.permissionCategories.create(category);
    await fetchData();
  }, [fetchData]);

  const updatePermissionCategory = useCallback(async (category: PermissionCategory) => {
    await api.settings.permissionCategories.update(category.id, category);
    await fetchData();
  }, [fetchData]);

  const deletePermissionCategory = useCallback(async (id: any) => {
    await api.settings.permissionCategories.delete(id);
    await fetchData();
  }, [fetchData]);

  const addPermissionSection = useCallback(async (section: Omit<PermissionSection, 'id'>) => {
    await api.settings.permissionSections.create(section);
    await fetchData();
  }, [fetchData]);

  const updatePermissionSection = useCallback(async (section: PermissionSection) => {
    await api.settings.permissionSections.update(section.id, section);
    await fetchData();
  }, [fetchData]);

  const deletePermissionSection = useCallback(async (id: any) => {
    await api.settings.permissionSections.delete(id);
    await fetchData();
  }, [fetchData]);

  const updatePaymentGatewaySettings = useCallback(async (settings: PaymentGatewaySettings) => {
    await api.settings.paymentGateway.update(settings);
    await fetchData();
  }, [fetchData]);

  const importLeads = useCallback(async (file: File, defaults: any) => { 
    const parseCsvLine = (line: string) => {
        const cells: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch === ',' && !inQuotes) {
                cells.push(current);
                current = '';
            } else {
                current += ch;
            }
        }
        cells.push(current);
        return cells.map(c => c.trim());
    };

    const mapRowsToLeads = (rows: string[][]) => {
      if (!rows.length) return [];
      const headers = rows[0] || [];
      const leadsArray: any[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !row.some(cell => String(cell || '').trim())) continue;
        const lead: any = {};
        headers.forEach((header, index) => {
          const normalizedHeader = String(header || '').replace(/^\uFEFF/, '').trim().toLowerCase();
          lead[normalizedHeader] = String(row[index] ?? '').trim();
        });
        leadsArray.push(lead);
      }
      return leadsArray;
    };

    try {
      const lowerName = file.name.toLowerCase();
      let leadsArray: any[] = [];

      if (lowerName.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split(/\r?\n/);
        const csvRows = lines.map(line => parseCsvLine(line));
        leadsArray = mapRowsToLeads(csvRows);
      } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        const { read, utils } = await import('xlsx');
        const data = await file.arrayBuffer();
        const workbook = read(data, { type: 'array', raw: false });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('Excel file has no sheet. Please upload a valid file.');
        }
        const firstSheet = workbook.Sheets[firstSheetName];
        const rows = (utils.sheet_to_json(firstSheet, { header: 1, raw: false, defval: '' }) as any[][])
          .map(row => row.map(cell => String(cell ?? '').trim()));
        leadsArray = mapRowsToLeads(rows as string[][]);
      } else {
        throw new Error('Unsupported file format. Please upload CSV, XLSX, or XLS.');
      }

      if (!leadsArray.length) {
        throw new Error('No data rows found in file. Please check template and try again.');
      }

      await api.data.importLeads({ leads: leadsArray, defaults, fileName: file.name });
      await fetchData();
    } catch (err: any) {
      const message = err?.message || 'Failed to read import file.';
      throw new Error(message);
    }
  }, [fetchData]);
  
  const deleteImportedLeadFile = useCallback(async (id: any) => { 
    await api.data.deleteImportRecord(id);
    await fetchData();
  }, [fetchData]);

  const logExport = useCallback(async (module: string, count: number) => {
    await api.data.logExport({ module, count });
    await fetchData();
  }, [fetchData]);
  
  const addTarget = useCallback(async (target: any) => { 
    await api.targets.create(target); 
    const tData = await api.targets.getAll();
    setTargets(tData);
  }, []);
  const deleteTarget = useCallback(async (id: any) => {
    await api.targets.delete(id);
    const tData = await api.targets.getAll();
    setTargets(tData);
  }, []);

  const addLeadStatus = useCallback(async (data: string | Partial<LeadStatus>) => {
    const payload = typeof data === 'string' ? { name: data } : data;
    await api.master.create('lead-status', payload);
    await fetchData();
  }, [fetchData]);
  const updateLeadStatus = useCallback(async (item: LeadStatus) => { await api.master.update('lead-status', item.id, item); await fetchData(); }, [fetchData]);
  const deleteLeadStatus = useCallback(async (id: string | number) => { await api.master.delete('lead-status', id); await fetchData(); }, [fetchData]);

  const addLeadCategory = useCallback(async (name: string) => { await api.master.create('lead-category', { name }); await fetchData(); }, [fetchData]);
  const updateLeadCategory = useCallback(async (item: LeadCategory) => { await api.master.update('lead-category', item.id, item); await fetchData(); }, [fetchData]);
  const deleteLeadCategory = useCallback(async (id: string | number) => { await api.master.delete('lead-category', id); await fetchData(); }, [fetchData]);
  
  const addApplicationStatus = useCallback(async (name: string) => { await api.master.create('application-status', { name }); await fetchData(); }, [fetchData]);
  const updateApplicationStatus = useCallback(async (item: ApplicationStatusItem) => { await api.master.update('application-status', item.id, item); await fetchData(); }, [fetchData]);
  const deleteApplicationStatus = useCallback(async (id: string | number) => { await api.master.delete('application-status', id); await fetchData(); }, [fetchData]);

  const addPassportStatus = useCallback(async (name: string) => { await api.master.create('passport-status', { name }); await fetchData(); }, [fetchData]);
  const updatePassportStatus = useCallback(async (item: PassportStatusItem) => { await api.master.update('passport-status', item.id, item); await fetchData(); }, [fetchData]);
  const deletePassportStatus = useCallback(async (id: string | number) => { await api.master.delete('passport-status', id); await fetchData(); }, [fetchData]);

  const addDocumentType = useCallback(async (name: string) => { await api.master.create('document-type', { name }); await fetchData(); }, [fetchData]);
  const updateDocumentType = useCallback(async (item: DocumentType) => { await api.master.update('document-type', item.id, item); await fetchData(); }, [fetchData]);
  const deleteDocumentType = useCallback(async (id: string | number) => { await api.master.delete('document-type', id); await fetchData(); }, [fetchData]);

  const addRemarkStatus = useCallback(async (name: string) => { await api.master.create('remark-status', { name }); await fetchData(); }, [fetchData]);
  const updateRemarkStatus = useCallback(async (item: RemarkStatus) => { await api.master.update('remark-status', item.id, item); await fetchData(); }, [fetchData]);
  const deleteRemarkStatus = useCallback(async (id: string | number) => { await api.master.delete('remark-status', id); await fetchData(); }, [fetchData]);

  const addLeadSource = useCallback(async (name: string) => { await api.master.create('lead-source', { name }); await fetchData(); }, [fetchData]);
  const updateLeadSource = useCallback(async (item: LeadSource) => { await api.master.update('lead-source', item.id, item); await fetchData(); }, [fetchData]);
  const deleteLeadSource = useCallback(async (id: string | number) => { await api.master.delete('lead-source', id); await fetchData(); }, [fetchData]);

  const addServiceType = useCallback(async (name: string) => { await api.master.create('service-type', { name }); await fetchData(); }, [fetchData]);
  const updateServiceType = useCallback(async (item: ServiceType) => { await api.master.update('service-type', item.id, item); await fetchData(); }, [fetchData]);
  const deleteServiceType = useCallback(async (id: string | number) => { await api.master.delete('service-type', id); await fetchData(); }, [fetchData]);

  const addLostReason = useCallback(async (name: string) => { await api.master.create('lost-reason', { name }); await fetchData(); }, [fetchData]);
  const updateLostReason = useCallback(async (item: LostReason) => { await api.master.update('lost-reason', item.id, item); await fetchData(); }, [fetchData]);
  const deleteLostReason = useCallback(async (id: string | number) => { await api.master.delete('lost-reason', id); await fetchData(); }, [fetchData]);

  const getEmailsForLead = useCallback((leadId: string | number) => emails.filter(e => String(e.leadId) === String(leadId)), [emails]);
  const sendEmail = useCallback(async (data: any) => { 
    await api.communications.sendEmail(data); 
    const eData = await api.communications.getEmails(data.leadId);
    setEmails(prev => [...prev.filter(e => String(e.leadId) !== String(data.leadId)), ...eData]);
  }, []);
  const getWhatsAppMessagesForLead = useCallback((leadId: string | number) => whatsappMessages.filter(m => String(m.leadId) === String(leadId)), [whatsappMessages]);
  const sendWhatsAppMessage = useCallback(async (leadId: any, content: string) => { 
    await api.communications.sendWhatsApp({ leadId, content }); 
    const wData = await api.communications.getWhatsApp(leadId);
    setWhatsAppMessages(prev => [...prev.filter(w => String(w.leadId) !== String(leadId)), ...wData]);
  }, []);

  const getCallLogsForLead = useCallback((leadId: string | number) => callLogs.filter(l => String(l.leadId) === String(leadId)), [callLogs]);

  const initiateCall = useCallback(async (leadId: string | number, leadName: string, phoneNumber: string) => {
    try {
      const res = await api.communications.initiateCall({ leadId, phoneNumber });
      if (res.success) {
        setActiveCall({
          leadId,
          leadName,
          phoneNumber,
          status: res.status === 'initiated' ? 'ringing' : res.status,
          callSid: res.callSid,
          startTime: Date.now(),
          duration: 0,
          isMock: res.isMock
        });

        // If mock, simulate connection after 2 seconds
        if (res.isMock) {
          setTimeout(async () => {
            setActiveCall(prev => prev ? { ...prev, status: 'connected', startTime: Date.now() } : null);
            await api.communications.updateMockCallStatus({ callSid: res.callSid, status: 'connected' });
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Failed to initiate call:', err);
      throw err;
    }
  }, []);

  const endCall = useCallback(async () => {
    if (!activeCall) return;
    const finalDuration = activeCall.duration;
    const sid = activeCall.callSid;
    const leadId = activeCall.leadId;

    setActiveCall(null);

    try {
      if (activeCall.isMock) {
        await api.communications.updateMockCallStatus({ 
          callSid: sid, 
          status: 'completed', 
          duration: finalDuration 
        });
      }
      // Refresh logs
      const logs = await api.communications.getCallLogs(leadId);
      setCallLogs((prev: any[]) => [...prev.filter((l: any) => String(l.leadId) !== String(leadId)), ...logs]);
      await fetchData(); // Refresh lead last activity
    } catch (err) {
      console.error('Failed to end call:', err);
    }
  }, [activeCall, fetchData]);

  const getUnreadMessageCountForUser = useCallback((userId: string | number) => messages.filter(m => !m.isRead && String(m.senderId) === String(userId)).length, [messages]);
  const getLastMessageForUser = useCallback((userId: string | number) => {
    const userMsgs = messages.filter(m => String(m.senderId) === String(userId) || String(m.receiverId) === String(userId));
    return userMsgs[userMsgs.length - 1];
  }, [messages]);

  const getTotalUnreadMessages = useCallback(() => {
    if (!currentUser) return 0;
    return messages.filter(m => !m.isRead && String(m.receiverId) === String(currentUser.id)).length;
  }, [messages, currentUser]);

  const getUnreadNotificationCount = useCallback(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const getCustomerById = useCallback((id: string | number) => customers.find(c => String(c.id) === String(id)), [customers]);
  const generateNextCustomerId = useCallback(() => `CUST-${customers.length + 1}`, [customers.length]);

  const openInvoiceModal = useCallback((i: Invoice | null) => { setEditingInvoice(i); setIsInvoiceModalOpen(true); }, []);
  const closeInvoiceModal = useCallback(() => setIsInvoiceModalOpen(false), []);
  const openUserModal = useCallback((u: User | null) => { setEditingUser(u); setIsUserModalOpen(true); }, []);
  const closeUserModal = useCallback(() => setIsUserModalOpen(false), []);

  const getUnassignedLeadsCount = useCallback(() => leads.filter(l => !l.assignedToId).length, [leads]);

  const contextValue = useMemo(() => ({
    currentUser, users, leads, customers, invoices, roles, vendors, leadNotes, leadReminders, leadDocuments,
    companyDetails, leadStatuses, leadSources, leadCategories, applicationStatuses, passportStatuses, documentTypes,
    remarkStatuses, serviceTypes, lostReasons, saleBy, workedBy,
    isLeadModalOpen, editingLead, isInvoiceModalOpen, editingInvoice,
    isUserModalOpen, editingUser, isRoleModalOpen, editingRole,
    isVendorModalOpen, editingVendor, isQuoteBuilderOpen, editingQuote, currentLeadIdForQuote,
    isLoading,
    systemLogs, userActivityLogs, notifications, announcements,
    workflowRules, isWorkflowModalOpen, editingWorkflow, permissionCategories, permissionSections,
    paymentGatewaySettings,
    importedLeadFiles, importedContactFiles, targets, emailApiCredentials, mobileApiCredentials,
    login, logout,
    openLeadModal, closeLeadModal, addLead, updateLead, deleteLead, bulkAssignLeads, bulkDeleteLeads, bulkUpdateLeadStatus, convertLeadToCustomer,
    openCustomerModal: () => {}, closeCustomerModal: () => {},
    addCustomer, updateCustomer, deleteCustomer, getCustomerById,
    generateNextCustomerId,
    openInvoiceModal, 
    closeInvoiceModal, 
    addInvoice, updateInvoice, deleteInvoice,
    openUserModal, 
    closeUserModal, 
    addUser, updateUser, deleteUser, updateProfile, getUserActivityLogs, fetchUserActivityLogs,
    fetchLeadActivities,
    getNotesForLead, addNoteForLead, updateNote, deleteNote,
    getRemindersForLead, addReminderForLead, updateReminder, deleteReminder, toggleReminderCompletion,
    getDocumentsForLead, addDocumentForLead, updateDocumentStatus, deleteDocumentForLead,
    getMessagesWithUser, sendMessage, getTotalUnreadMessages,
    markMessagesAsRead, getUnreadMessageCountForUser, getLastMessageForUser,
    openVendorModal, closeVendorModal, addVendor, updateVendor, deleteVendor,
    openRoleModal, closeRoleModal, addRole, updateRole, deleteRole,
    getQuotesForLead, openQuoteBuilder, closeQuoteBuilder, addQuote, updateQuote,
    updateCompanyDetails, updateEmailApiCredentials, updateMobileApiCredentials,
    addSaleBy, updateSaleBy, deleteSaleBy, addWorkedBy, updateWorkedBy, deleteWorkedBy,
    markNotificationAsRead, markAllNotificationsAsRead, getUnreadNotificationCount, fetchNotifications,
    addAnnouncement, deleteAnnouncement,
    openWorkflowModal, closeWorkflowModal, addWorkflowRule, updateWorkflowRule, deleteWorkflowRule,
    addPermissionCategory, updatePermissionCategory, deletePermissionCategory,
    addPermissionSection, updatePermissionSection, deletePermissionSection,
    updatePaymentGatewaySettings,
    importLeads, deleteImportedLeadFile, logExport, addTarget, deleteTarget,
    addLeadStatus, updateLeadStatus, deleteLeadStatus, addLeadCategory, updateLeadCategory, deleteLeadCategory,
    addApplicationStatus, updateApplicationStatus, deleteApplicationStatus,
    addPassportStatus, updatePassportStatus, deletePassportStatus,
    addDocumentType, updateDocumentType, deleteDocumentType,
    addRemarkStatus, updateRemarkStatus, deleteRemarkStatus,
    addLeadSource, updateLeadSource, deleteLeadSource,
    addServiceType, updateServiceType, deleteServiceType,
    addLostReason, updateLostReason, deleteLostReason,
    getEmailsForLead, sendEmail, getWhatsAppMessagesForLead, sendWhatsAppMessage,
    activeCall, getCallLogsForLead, initiateCall, endCall, getUnassignedLeadsCount
  }), [
    currentUser, users, leads, customers, invoices, roles, vendors, leadNotes, leadReminders, leadDocuments,
    companyDetails, leadStatuses, leadSources, leadCategories, applicationStatuses, passportStatuses, documentTypes,
    remarkStatuses, serviceTypes, lostReasons, saleBy, workedBy,
    isLeadModalOpen, editingLead, isInvoiceModalOpen, editingInvoice,
    isUserModalOpen, editingUser, isRoleModalOpen, editingRole,
    isVendorModalOpen, editingVendor, isQuoteBuilderOpen, editingQuote, currentLeadIdForQuote,
    isLoading, systemLogs, userActivityLogs, notifications, announcements,
    workflowRules, isWorkflowModalOpen, editingWorkflow, permissionCategories, permissionSections,
    importedLeadFiles, importedContactFiles, targets, emailApiCredentials, mobileApiCredentials,
    login, logout, openLeadModal, closeLeadModal, addLead, updateLead, deleteLead, bulkAssignLeads, bulkDeleteLeads,
    bulkUpdateLeadStatus, convertLeadToCustomer, addCustomer, updateCustomer, deleteCustomer,
    getUserActivityLogs, fetchUserActivityLogs, fetchLeadActivities, getNotesForLead, addNoteForLead, updateNote, deleteNote,
    getRemindersForLead, addReminderForLead, updateReminder, deleteReminder, toggleReminderCompletion,
    getDocumentsForLead, addDocumentForLead, updateDocumentStatus, deleteDocumentForLead,
    getMessagesWithUser, sendMessage, getTotalUnreadMessages, markMessagesAsRead,
    getUnreadMessageCountForUser, getLastMessageForUser, openVendorModal, closeVendorModal,
    addVendor, updateVendor, deleteVendor, openRoleModal, closeRoleModal, addRole, updateRole,
    deleteRole, getQuotesForLead, openQuoteBuilder, closeQuoteBuilder, addQuote, updateQuote,
    updateCompanyDetails, updateEmailApiCredentials, updateMobileApiCredentials, addSaleBy,
    updateSaleBy, deleteSaleBy, addWorkedBy, updateWorkedBy, deleteWorkedBy,
    markNotificationAsRead, markAllNotificationsAsRead, getUnreadNotificationCount, fetchNotifications, 
    addAnnouncement, deleteAnnouncement,
    openWorkflowModal, closeWorkflowModal, addWorkflowRule, updateWorkflowRule, deleteWorkflowRule,
    addPermissionCategory, updatePermissionCategory, deletePermissionCategory,
    addPermissionSection, updatePermissionSection, deletePermissionSection,
    updatePaymentGatewaySettings,
    importLeads,
    deleteImportedLeadFile, logExport, addTarget, deleteTarget, addLeadStatus, updateLeadStatus, deleteLeadStatus,
    addLeadCategory, updateLeadCategory, deleteLeadCategory,
    addApplicationStatus, updateApplicationStatus, deleteApplicationStatus, addPassportStatus,
    updatePassportStatus, deletePassportStatus, addDocumentType, updateDocumentType,
    deleteDocumentType, addRemarkStatus, updateRemarkStatus, deleteRemarkStatus, addLeadSource,
    updateLeadSource, deleteLeadSource, addServiceType, updateServiceType, deleteServiceType,
    addLostReason, updateLostReason, deleteLostReason, getEmailsForLead, sendEmail,
    getWhatsAppMessagesForLead, sendWhatsAppMessage, activeCall, getCallLogsForLead, initiateCall, endCall, getUnassignedLeadsCount, quotes, emails, whatsappMessages, messages, callLogs
  ]);

  return <CrmContext.Provider value={contextValue}>{children}</CrmContext.Provider>;
};
