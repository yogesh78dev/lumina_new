
import { ReactNode } from 'react';

export interface LeadSource {
  id: string | number;
  name: string;
}

export interface LeadStatus {
  id: string | number;
  name: string;
}

export interface ApplicationStatusItem {
  id: string | number;
  name: string;
}

export interface PassportStatusItem {
  id: string | number;
  name: string;
}

export interface DocumentType {
  id: string | number;
  name: string;
}

export interface RemarkStatus {
  id: string | number;
  name: string;
}

export interface ServiceType {
  id: string | number;
  name: string;
}

export interface LostReason {
  id: string | number;
  name: string;
}

export type PermissionAction = 'create' | 'read' | 'update' | 'delete';
export type ModuleName = 'leads' | 'customers' | 'invoices' | 'reminders' | 'users' | 'roles' | 'settings' | 'vendors' | 'workflows';
export type Permissions = Partial<Record<ModuleName, PermissionAction[]>>;

export interface Role {
  id: string | number;
  name: string;
  permissions: Permissions;
  status?: 'Active' | 'Inactive';
}

export interface User {
  id: string | number;
  name: string; 
  username: string;
  email: string;
  roleId: string | number;
  role: string;
  password?: string;
  status: 'Active' | 'Inactive';
  imageUrl?: string;
}

export enum DocumentStatus {
  PENDING = 'Pending',
  UPLOADED = 'Uploaded',
  VERIFIED = 'Verified',
  REJECTED = 'Rejected',
}

export interface LeadDocument {
  id: string | number;
  leadId: string | number;
  name: string;
  status: DocumentStatus;
  fileName?: string;
  fileType?: string;
  fileData?: string;
  notes?: string;
}

export interface Lead {
  id: string | number;
  name: string;
  phone: string;
  phone2?: string;
  phone3?: string;
  phone4?: string;
  email?: string;
  service?: string;
  country?: string;
  leadSource: string;
  leadStatus: string; 
  applicationStatus: string; 
  passportStatus: string; 
  documents: LeadDocument[];
  companyName?: string;
  location?: string;
  createdAt: string;
  assignedToId?: string | number;
  lastActivityAt?: string; 
  // Activity counts for immediate UI feedback in lists
  notesCount?: number;
  remindersCount?: number;
  latestNote?: string;
}

export interface Customer {
  id: string | number; 
  customerId: string; 
  name: string;
  phone: string;
  email?: string;
  country?: string;
  companyName?: string;
  gstNumber?: string;
  location?: string;
  vendorId: string | number;
  saleById: string | number;
  serviceType: string;
  closeDate: string;
  action: string;
  passportStatus: string;
  createdAt: string;
}

export interface Vendor {
  id: string | number;
  name: string;
}

export interface LeadNote {
  id: string | number;
  leadId: string | number;
  content: string;
  createdAt: string;
  author: string; 
}

export interface LeadReminder {
    id: string | number;
    leadId: string | number;
    note: string;
    dueDate: string;
    isCompleted: boolean;
}

export enum InvoiceStatus {
  PAID = 'Paid',
  SENT = 'Sent',
  OVERDUE = 'Overdue',
  DRAFT = 'Draft',
}

export interface Invoice {
  id: string | number;
  customerId: string | number;
  customerName: string;
  amount: number;
  issuedDate: string;
  dueDate: string;
  status: InvoiceStatus;
}

export interface ChatMessage {
  id: string | number;
  senderId: string | number;
  receiverId: string | number;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface Announcement {
  id: string | number;
  subject: string;
  content: string;
  recipients: (string | number)[]; 
  scheduledAt: string;
  authorId: string | number;
}

export interface SocialMediaCredentials {
  facebookAppId: string;
  facebookAppSecret: string;
  facebookAccessToken: string;
}

export interface CompanyDetails {
  companyName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  fromName: string;
  fromEmail: string;
  replyName: string;
  replyEmail: string;
  helpEmail: string;
  infoEmail: string;
  phone: string;
  secondaryPhone: string;
  instagramLink: string;
  facebookLink: string;
  twitterLink: string;
  linkedinLink: string;
  website: string;
  gstNo: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  logoUrl?: string;
  faviconUrl?: string;
  socialMedia?: SocialMediaCredentials;
}

export interface EmailApiCredentials {
  apiName: string;
  apiUrl: string;
  apiKey: string;
}

export interface MobileApiCredentials {
  apiName: string;
  fromNumber: string;
  sid: string;
  token: string;
}

export interface UserActivityLog {
  id: string | number;
  userId: string | number;
  ipAddress: string;
  userAgent: string;
  loginDate: string;
  logoutDate?: string;
  status: 'Logged In' | 'Logged Out';
  location: string;
}

export interface SystemLog {
  id: string | number;
  userId: string | number;
  userName: string;
  role: string;
  title: string;
  createdAt: string;
}

export interface PermissionCategory {
  id: string | number;
  title: string;
  status: 'Active' | 'Inactive';
}

export interface PermissionSection {
  id: string | number;
  title: string;
  category: string;
  status: 'Active' | 'Inactive';
}

export interface SaleBy {
  id: string | number;
  name: string;
  status: 'Active' | 'Inactive';
}

export interface WorkedBy {
  id: string | number;
  name: string;
  status: 'Active' | 'Inactive';
}

export interface ImportedFile {
  id: string | number;
  fileName: string;
  totalLeads: number;
  addedBy: string;
  createdAt: string;
}

export interface Target {
  id: string | number;
  userId: string | number;
  userName?: string; 
  targetAmount: number;
  achieveAmount: number;
  status: 'Active' | 'Inactive';
  module: string; 
}

export interface Notification {
    id: string | number;
    userId: string | number;
    title: string;
    content: string;
    createdAt: string;
    isRead: boolean;
    linkTo?: string;
    icon: string;
    iconColor: string;
}

export interface Email {
    id: string | number;
    leadId: string | number;
    from: string;
    to: string;
    subject: string;
    body: string;
    timestamp: string;
    type: 'incoming' | 'outgoing';
    isRead: boolean;
}

export interface WhatsAppMessage {
    id: string | number;
    leadId: string | number;
    content: string;
    timestamp: string;
    type: 'incoming' | 'outgoing';
    isRead: boolean;
}

export interface CallLog {
    id: string | number;
    leadId: string | number;
    userId: string | number;
    userName?: string;
    callSid: string;
    status: 'initiated' | 'ringing' | 'connected' | 'failed' | 'completed' | 'no-answer' | 'busy' | 'canceled';
    direction: 'inbound' | 'outbound';
    duration: number;
    recordingUrl?: string;
    createdAt: string;
}

export interface QuoteItem {
    id: string | number;
    description: string;
    quantity: number;
    price: number;
    total: number;
}

export enum QuoteStatus {
    DRAFT = 'Draft',
    SENT = 'Sent',
    ACCEPTED = 'Accepted',
    REJECTED = 'Rejected',
}

export interface Quote {
    id: string | number;
    leadId: string | number;
    quoteNumber: string;
    createdAt: string;
    validUntil: string;
    status: QuoteStatus;
    items: QuoteItem[];
    subtotal: number;
    tax: number;
    total: number;
}

export interface LeadTableColumn {
  key: string;
  label: string;
}

export type TriggerModule = 'Lead';
export type TriggerEvent = 'updated';
export type TriggerField = 'leadStatus' | 'assignedToId';
export type ActionType = 'createReminder' | 'createNote';

export interface WorkflowRule {
    id: string | number;
    name: string;
    triggerModule: TriggerModule;
    triggerEvent: TriggerEvent;
    conditions: {
        field: TriggerField;
        value: string;
    }[];
    actionType: ActionType;
    actionDetails: {
        note?: string;
        dueInDays?: number;
    };
}

// FIX: Added missing PaymentGatewaySettings interface used in mockData.ts
export interface PaymentGatewaySettings {
  gatewayName: string;
  apiKey: string;
  apiSecret: string;
}

// FIX: Added missing DuplicateData interface imported in mockData.ts
export interface DuplicateData {
  id: string | number;
  leadId: string | number;
  duplicateField: string;
  duplicateValue: string;
}

// FIX: Added missing ExportRequest interface imported in mockData.ts and DataAdministrationPage.tsx
export interface ExportRequest {
  id: string | number;
  fileName: string;
  requestedBy: string;
  status: 'Pending' | 'Completed' | 'Failed';
  requestedAt: string;
}

// FIX: Added missing TargetListItem interface imported in mockData.ts and DataAdministrationPage.tsx
export interface TargetListItem {
  id: string | number;
  userId: string | number;
  userName: string;
  targetAmount: number;
  achieveAmount: number;
  module: string;
}

export interface PaymentGatewaySettings {
  id?: number;
  gatewayName: string;
  apiKey: string;
  apiSecret: string;
}
