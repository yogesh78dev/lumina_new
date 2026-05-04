import { createContext } from 'react';
import {
  Lead, Customer, Invoice, User, Role, Vendor, LeadNote, LeadReminder, LeadDocument,
  CompanyDetails, EmailApiCredentials, MobileApiCredentials, DocumentStatus,
  SystemLog, PermissionCategory, PermissionSection, ImportedFile, Announcement,
  Target, Notification, Email, WhatsAppMessage, Quote, WorkflowRule,
  SaleBy, WorkedBy, LeadStatus, LeadSource, ApplicationStatusItem, PassportStatusItem,
  DocumentType, RemarkStatus, ServiceType, LostReason,
  UserActivityLog, ChatMessage, CallLog, PaymentGatewaySettings
} from '../types';

export interface CrmContextType {
  currentUser: User | null;
  users: User[];
  leads: Lead[];
  customers: Customer[];
  invoices: Invoice[];
  roles: Role[];
  vendors: Vendor[];
  leadNotes: LeadNote[];
  leadReminders: LeadReminder[];
  leadDocuments: LeadDocument[];
  companyDetails: CompanyDetails;
  
  activeCall: {
    leadId: string | number;
    leadName: string;
    phoneNumber: string;
    status: string;
    callSid: string;
    startTime: number;
    duration: number;
    isMock: boolean;
  } | null;
  leadStatuses: LeadStatus[];
  leadSources: LeadSource[];
  applicationStatuses: ApplicationStatusItem[];
  passportStatuses: PassportStatusItem[];
  documentTypes: DocumentType[];
  remarkStatuses: RemarkStatus[];
  serviceTypes: ServiceType[];
  lostReasons: LostReason[];
  // Added missing saleBy and workedBy to the context type
  saleBy: SaleBy[];
  workedBy: WorkedBy[];

  isLeadModalOpen: boolean;
  editingLead: Lead | null;
  isInvoiceModalOpen: boolean;
  editingInvoice: Invoice | null;
  isUserModalOpen: boolean;
  editingUser: User | null;
  isRoleModalOpen: boolean;
  editingRole: Role | null;
  isVendorModalOpen: boolean;
  editingVendor: Vendor | null;
  isQuoteBuilderOpen: boolean;
  editingQuote: Quote | null;
  currentLeadIdForQuote: string | null;

  isLoading: boolean;

  systemLogs: SystemLog[];
  userActivityLogs: UserActivityLog[];
  notifications: Notification[];
  announcements: Announcement[];
  workflowRules: WorkflowRule[];
  isWorkflowModalOpen: boolean;
  editingWorkflow: WorkflowRule | null;
  permissionCategories: PermissionCategory[];
  permissionSections: PermissionSection[];
  importedLeadFiles: ImportedFile[];
  importedContactFiles: ImportedFile[];
  targets: Target[];
  emailApiCredentials: EmailApiCredentials;
  mobileApiCredentials: MobileApiCredentials;
  paymentGatewaySettings: PaymentGatewaySettings | null;

  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;

  openLeadModal: (lead: Lead | null) => void;
  closeLeadModal: () => void;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => Promise<void>;
  updateLead: (lead: Lead) => Promise<void>;
  deleteLead: (id: string | number) => Promise<void>;
  bulkAssignLeads: (ids: (string | number)[], userId: string | number) => Promise<void>;
  bulkDeleteLeads: (ids: (string | number)[]) => Promise<void>;
  bulkUpdateLeadStatus: (ids: (string | number)[], status: string) => Promise<void>;
  convertLeadToCustomer: (lead: Lead) => Promise<void>;

  openCustomerModal: (customer: Customer | null) => void;
  closeCustomerModal: () => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'customerId'>) => Promise<void>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string | number) => Promise<void>;
  getCustomerById: (id: string | number) => Customer | undefined;
  generateNextCustomerId: () => string;

  openInvoiceModal: (invoice: Invoice | null) => void;
  closeInvoiceModal: () => void;
  addInvoice: (invoice: any) => Promise<void>;
  updateInvoice: (invoice: Invoice) => Promise<void>;
  deleteInvoice: (id: string | number) => Promise<void>;

  openUserModal: (user: User | null) => void;
  closeUserModal: () => void;
  addUser: (user: any) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string | number) => Promise<void>;
  updateProfile: (userId: string | number, data: Partial<User>) => Promise<void>;
  getUserActivityLogs: (userId: string | number) => UserActivityLog[];
  fetchUserActivityLogs: (userId: string | number) => Promise<void>;

  fetchLeadActivities: (leadId: string | number) => Promise<void>;
  getNotesForLead: (leadId: string | number) => LeadNote[];
  addNoteForLead: (leadId: string | number, content: string) => Promise<void>;
  updateNote: (id: string | number, content: string) => Promise<void>;
  deleteNote: (id: string | number, noteId: string | number) => Promise<void>;

  getRemindersForLead: (leadId: string | number) => LeadReminder[];
  addReminderForLead: (leadId: string | number, note: string, dueDate: string) => Promise<void>;
  updateReminder: (id: string | number, note: string, dueDate: string) => Promise<void>;
  deleteReminder: (id: string | number, reminderId: string | number) => Promise<void>;
  toggleReminderCompletion: (id: string | number) => Promise<void>;

  getDocumentsForLead: (leadId: string | number) => LeadDocument[];
  addDocumentForLead: (leadId: string | number, name: string) => Promise<void>;
  updateDocumentStatus: (leadId: string | number, docId: string | number, status: DocumentStatus, fileName?: string, fileType?: string, fileData?: string) => Promise<void>;
  deleteDocumentForLead: (leadId: string | number, docId: string | number) => Promise<void>;

  getMessagesWithUser: (userId: string | number) => ChatMessage[];
  sendMessage: (receiverId: string | number, content: string) => Promise<void>;
  getTotalUnreadMessages: () => number;
  markMessagesAsRead: (userId: string | number) => Promise<void>;
  getUnreadMessageCountForUser: (userId: string | number) => number;
  getLastMessageForUser: (userId: string | number) => ChatMessage | undefined;

  openVendorModal: (vendor: Vendor | null) => void;
  closeVendorModal: () => void;
  addVendor: (vendor: Omit<Vendor, 'id'>) => Promise<void>;
  updateVendor: (vendor: Vendor) => Promise<void>;
  deleteVendor: (id: string | number) => Promise<void>;

  openRoleModal: (role: Role | null) => void;
  closeRoleModal: () => void;
  addRole: (role: Omit<Role, 'id'>) => Promise<void>;
  updateRole: (role: Role) => Promise<void>;
  deleteRole: (id: string | number) => Promise<void>;

  getQuotesForLead: (leadId: string | number) => Quote[];
  openQuoteBuilder: (leadId: string | number, quote?: Quote | null) => void;
  closeQuoteBuilder: () => void;
  addQuote: (leadId: string | number, quote: Omit<Quote, 'id' | 'leadId' | 'quoteNumber'>) => Promise<void>;
  updateQuote: (quote: Quote) => Promise<void>;

  updateCompanyDetails: (details: CompanyDetails) => Promise<void>;
  updateEmailApiCredentials: (creds: EmailApiCredentials) => Promise<void>;
  updateMobileApiCredentials: (creds: MobileApiCredentials) => Promise<void>;
  updatePaymentGatewaySettings: (settings: PaymentGatewaySettings) => Promise<void>;

  addSaleBy: (data: Omit<SaleBy, 'id'>) => Promise<void>;
  updateSaleBy: (data: SaleBy) => Promise<void>;
  deleteSaleBy: (id: string | number) => Promise<void>;
  addWorkedBy: (data: Omit<WorkedBy, 'id'>) => Promise<void>;
  updateWorkedBy: (data: WorkedBy) => Promise<void>;
  deleteWorkedBy: (id: string | number) => Promise<void>;

  markNotificationAsRead: (id: string | number) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  getUnreadNotificationCount: () => number;
  fetchNotifications: () => Promise<void>;

  addAnnouncement: (data: any) => Promise<void>;
  deleteAnnouncement: (id: string | number) => Promise<void>;

  openWorkflowModal: (rule: WorkflowRule | null) => void;
  closeWorkflowModal: () => void;
  addWorkflowRule: (rule: Omit<WorkflowRule, 'id'>) => Promise<void>;
  updateWorkflowRule: (rule: WorkflowRule) => Promise<void>;
  deleteWorkflowRule: (id: string | number) => Promise<void>;

  addPermissionCategory: (cat: Omit<PermissionCategory, 'id'>) => Promise<void>;
  updatePermissionCategory: (cat: PermissionCategory) => Promise<void>;
  deletePermissionCategory: (id: string | number) => Promise<void>;
  addPermissionSection: (sec: Omit<PermissionSection, 'id'>) => Promise<void>;
  updatePermissionSection: (sec: PermissionSection) => Promise<void>;
  deletePermissionSection: (id: string | number) => Promise<void>;

  importLeads: (file: File, defaults: any) => Promise<void>;
  deleteImportedLeadFile: (id: string | number) => Promise<void>;
  logExport: (module: string, count: number) => Promise<void>;
  addTarget: (target: Omit<Target, 'id' | 'userName' | 'achieveAmount' | 'status'>) => Promise<void>;
  deleteTarget: (id: string | number) => Promise<void>;

  addLeadStatus: (name: string) => Promise<void>;
  updateLeadStatus: (item: LeadStatus) => Promise<void>;
  deleteLeadStatus: (id: string | number) => Promise<void>;
  addApplicationStatus: (name: string) => Promise<void>;
  updateApplicationStatus: (item: ApplicationStatusItem) => Promise<void>;
  deleteApplicationStatus: (id: string | number) => Promise<void>;
  addPassportStatus: (name: string) => Promise<void>;
  updatePassportStatus: (item: PassportStatusItem) => Promise<void>;
  deletePassportStatus: (id: string | number) => Promise<void>;
  addDocumentType: (name: string) => Promise<void>;
  updateDocumentType: (item: DocumentType) => Promise<void>;
  deleteDocumentType: (id: string | number) => Promise<void>;
  addRemarkStatus: (name: string) => Promise<void>;
  updateRemarkStatus: (item: RemarkStatus) => Promise<void>;
  deleteRemarkStatus: (id: string | number) => Promise<void>;
  addLeadSource: (name: string) => Promise<void>;
  updateLeadSource: (item: LeadSource) => Promise<void>;
  deleteLeadSource: (id: string | number) => Promise<void>;
  addServiceType: (name: string) => Promise<void>;
  updateServiceType: (item: ServiceType) => Promise<void>;
  deleteServiceType: (id: string | number) => Promise<void>;
  addLostReason: (name: string) => Promise<void>;
  updateLostReason: (item: LostReason) => Promise<void>;
  deleteLostReason: (id: string | number) => Promise<void>;

  getEmailsForLead: (leadId: string | number) => Email[];
  sendEmail: (data: any) => Promise<void>;
  getWhatsAppMessagesForLead: (leadId: string | number) => WhatsAppMessage[];
  sendWhatsAppMessage: (leadId: string | number, content: string) => Promise<void>;
  getCallLogsForLead: (leadId: string | number) => CallLog[];
  initiateCall: (leadId: string | number, leadName: string, phoneNumber: string) => Promise<void>;
  endCall: () => Promise<void>;
}

export const CrmContext = createContext<CrmContextType | undefined>(undefined);
