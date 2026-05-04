
import { Lead, Customer, Invoice, InvoiceStatus, LeadSource, LeadStatus, User, Role, LeadNote, LeadReminder, Permissions, Vendor, DocumentStatus, ChatMessage, CompanyDetails, Announcement, EmailApiCredentials, MobileApiCredentials, PaymentGatewaySettings, UserActivityLog, SystemLog, PermissionCategory, PermissionSection, SaleBy, WorkedBy, ImportedFile, DuplicateData, ExportRequest, Target, TargetListItem, Notification, Email, WhatsAppMessage, Quote, QuoteStatus, WorkflowRule, ApplicationStatusItem, RemarkStatus, ServiceType, LostReason, PassportStatusItem, DocumentType } from '../types';
import { v4 as uuidv4 } from 'uuid';

const superAdminPermissions: Permissions = {
  leads: ['create', 'read', 'update', 'delete'],
  customers: ['create', 'read', 'update', 'delete'],
  invoices: ['create', 'read', 'update', 'delete'],
  reminders: ['create', 'read', 'update', 'delete'],
  users: ['create', 'read', 'update', 'delete'],
  roles: ['create', 'read', 'update', 'delete'],
  settings: ['create', 'read', 'update', 'delete'], // Full Settings Access
  vendors: ['create', 'read', 'update', 'delete'],
  workflows: ['create', 'read', 'update', 'delete'],
};

const adminPermissions: Permissions = {
  leads: ['create', 'read', 'update', 'delete'],
  customers: ['create', 'read', 'update', 'delete'],
  invoices: ['create', 'read', 'update', 'delete'],
  reminders: ['create', 'read', 'update', 'delete'],
  users: ['create', 'read', 'update', 'delete'], // Can manage users but maybe not delete
  roles: ['read'], // Can view roles but not modify permissions
  settings: ['read'], // Can view settings but not change API keys
  vendors: ['create', 'read', 'update', 'delete'],
  workflows: ['create', 'read', 'update'],
};

const salesAgentPermissions: Permissions = {
  leads: ['create', 'read', 'update'], // No delete
  customers: ['create', 'read', 'update'],
  invoices: ['read'],
  reminders: ['create', 'read', 'update'],
  users: ['read'], // Can see other users for chat/assignment logic
  roles: [],
  settings: [], // No settings access
  vendors: ['read'],
  workflows: [],
};

const supportPermissions: Permissions = {
  leads: ['read', 'update'],
  customers: ['read', 'update'],
  invoices: ['read'],
  reminders: ['create', 'read', 'update'],
  users: ['read'],
  roles: [],
  settings: [],
  vendors: ['read'],
};


export const mockRoles: Role[] = [
  { id: 'role-super-admin', name: 'Super Admin', permissions: superAdminPermissions, status: 'Active' },
  { id: 'role-1', name: 'Admin', permissions: adminPermissions, status: 'Active' },
  { id: 'role-2', name: 'Sales Agent', permissions: salesAgentPermissions, status: 'Active' },
  { id: 'role-3', name: 'Support', permissions: supportPermissions, status: 'Active' },
  { id: 'role-4', name: 'Accountant', permissions: { invoices: ['create', 'read', 'update'] }, status: 'Active' },
  { id: 'role-5', name: 'Manager', permissions: { ...salesAgentPermissions, leads: ['read'] }, status: 'Active' },
  { id: 'role-6', name: 'Tech', permissions: { settings: ['read', 'update']}, status: 'Inactive' },
  { id: 'role-7', name: 'Sales', permissions: {}, status: 'Active' },
];

export const mockUsers: User[] = [
    // Added roleId to each mock user to fix property missing error
    { id: 'user-1', name: 'Jyoti Sharma', username: 'jyoti.sharma', email: 'jyoti.sharma@theglobalvisa.in', roleId: 'role-2', role: 'Sales Agent', password: 'password123', imageUrl: 'https://xsgames.co/randomusers/assets/avatars/female/68.jpg', status: 'Active' },
    { id: 'user-2', name: 'Lakshay Chaudhary', username: 'lakshay.chaudhary', email: 'lakshay.chaudhary@theglobalvisa.in', roleId: 'role-2', role: 'Sales Agent', password: 'password123', status: 'Active', imageUrl: 'https://xsgames.co/randomusers/assets/avatars/male/46.jpg' },
    { id: 'user-3', name: 'Kartik Tyagi', username: 'kartik.tyagi', email: 'kartik.tyagi@theglobalvisa.in', roleId: 'role-2', role: 'Sales Agent', password: 'password123', imageUrl: 'https://xsgames.co/randomusers/assets/avatars/male/52.jpg', status: 'Active' },
    { id: 'user-4', name: 'Varun Jain', username: 'varun.jain', email: 'varun.jain@theglobalvisa.in', roleId: 'role-1', role: 'Admin', password: 'password123', status: 'Active', imageUrl: 'https://xsgames.co/randomusers/assets/avatars/male/5.jpg' },
    { id: 'user-5', name: 'Yogesh Kumar', username: 'yogesh.kumar', email: 'yogesh.kumar@theglobalvisa.in', roleId: 'role-1', role: 'Admin', password: 'password123', status: 'Active', imageUrl: 'https://xsgames.co/randomusers/assets/avatars/male/1.jpg' },
    { id: 'user-6', name: 'Rajiv Gangwar', username: 'rajiv.gangwar', email: 'rajiv.gangwar@theglobalvisa.in', roleId: 'role-super-admin', role: 'Super Admin', password: 'password123', status: 'Active', imageUrl: 'https://xsgames.co/randomusers/assets/avatars/male/74.jpg' },
    { id: 'user-7', name: 'Rama Jain', username: 'rama.jain', email: 'rama.jain@theglobalvisa.in', roleId: 'role-super-admin', role: 'Super Admin', password: 'password123', status: 'Active', imageUrl: 'https://xsgames.co/randomusers/assets/avatars/female/25.jpg' },
    { id: 'user-8', name: 'Priya Singh', username: 'priya.singh', email: 'priya.singh@theglobalvisa.in', roleId: 'role-5', role: 'Manager', password: 'password123', status: 'Active', imageUrl: 'https://xsgames.co/randomusers/assets/avatars/female/31.jpg' },
    { id: 'user-9', name: 'Amit Patel', username: 'amit.patel', email: 'amit.patel@theglobalvisa.in', roleId: 'role-3', role: 'Support', password: 'password123', status: 'Active', imageUrl: 'https://xsgames.co/randomusers/assets/avatars/male/32.jpg' },
    { id: 'user-10', name: 'Sneha Desai', username: 'sneha.desai', email: 'sneha.desai@theglobalvisa.in', roleId: 'role-2', role: 'Sales Agent', password: 'password123', status: 'Active', imageUrl: 'https://xsgames.co/randomusers/assets/avatars/female/15.jpg' },
];

export const mockVendors: Vendor[] = [
    { id: 'vendor-1', name: 'TravelPro Services' },
    { id: 'vendor-2', name: 'Global Voyages Ltd.' },
    { id: 'vendor-3', name: 'AirLink Partners' },
    { id: 'vendor-4', name: 'Adventure Tours Inc.' },
    { id: 'vendor-5', name: 'Visa Fasttrackers' },
    { id: 'vendor-6', name: 'Global Connect Travel' },
    { id: 'vendor-7', name: 'SkyHigh Travels' },
    { id: 'vendor-8', name: 'Ocean Blue Vacations' },
    { id: 'vendor-9', name: 'Mountain Peak Adventures' },
    { id: 'vendor-10', name: 'Cityscape Tours' },
    { id: 'vendor-11', name: 'Desert Wanderers' },
    { id: 'vendor-12', name: 'Island Getaways' },
    { id: 'vendor-13', name: 'Heritage Explorers' },
    { id: 'vendor-14', name: 'Luxury Escapes Co.' },
    { id: 'vendor-15', name: 'Budget Friendly Trips' },
    { id: 'vendor-16', name: 'Visa Express' },
    { id: 'vendor-17', name: 'Passport Pros' },
    { id: 'vendor-18', name: 'Global Entry Services' },
    { id: 'vendor-19', name: 'Air Charter Pro' },
    { id: 'vendor-20', name: 'Cruise Planners' },
    { id: 'vendor-21', name: 'Safari Experts' },
    { id: 'vendor-22', name: 'Exotic Destinations' },
];

export const mockLeadSources: LeadSource[] = [
  { id: '1', name: 'IVR' },
  { id: '2', name: 'Google' },
  { id: '3', name: 'Direct/Rep' },
  { id: '4', name: 'Agent' },
  { id: '5', name: 'IVR Message' },
  { id: '6', name: 'Social Media' },
  { id: '7', name: 'Walk-In' },
  { id: '8', name: 'Website Inquiry' },
];

export const mockLeadStatuses: LeadStatus[] = [
  { id: '1', name: 'New Lead' },
  { id: '2', name: 'Follow-up' },
  { id: '3', name: 'Won' },
  { id: '4', name: 'Lost' },
];

// Helper to get date relative to now
const getDateAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
}

const getTimestampAgo = (days: number, hours = 0, minutes = 0) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(date.getHours() - hours);
    date.setMinutes(date.getMinutes() - minutes);
    return date.toISOString();
}

export const mockLeads: Lead[] = [
  // --- TODAY'S LEADS (New & High Priority) ---
  { id: 'lead-1', name: 'Vinit Doshi', phone: '9974230977', email: 'vntdoshi@gmail.com', service: 'Dubai Visitor Visa', location: 'Surat', leadSource: 'Google', leadStatus: 'New Lead', createdAt: getTimestampAgo(0, 1), assignedToId: 'user-1', applicationStatus: 'Documents Pending', passportStatus: 'With Client', documents: [] },
  { id: 'lead-2', name: 'Revlita Fernandes', phone: '7798168969', email: 'revm1010@gmail.com', service: 'German National Visa', location: 'Goa', leadSource: 'Website Inquiry', leadStatus: 'New Lead', createdAt: getTimestampAgo(0, 2), assignedToId: 'user-1', applicationStatus: 'Documents Pending', passportStatus: 'With Client', documents: [] },
  { id: 'lead-3', name: 'Zibran Patni', phone: '9510306166', email: 'bhurapatni707@gmail.com', service: 'Work Visa Inquiry', location: 'Veraval', leadSource: 'IVR', leadStatus: 'Lost', createdAt: getTimestampAgo(0, 3), assignedToId: 'user-2', applicationStatus: 'Documents Pending', passportStatus: 'With Client', documents: [] },
  { id: 'lead-4', name: 'Vivek Soni', phone: '9638734419', email: 'Soni.vivekk26@gmail.com', service: 'Singapore Tourist Visa', location: 'Bhuj', leadSource: 'Google', leadStatus: 'Follow-up', createdAt: getTimestampAgo(0, 4), lastActivityAt: getTimestampAgo(0, 1), assignedToId: 'user-2', applicationStatus: 'Documents Pending', passportStatus: 'With Client', documents: [] },
  { id: 'lead-5', name: 'Trushar Shantilal Rana', phone: '09099984683', email: 'trushar_rana1@rediffmail.com', service: 'Dubai Visit Visa', location: 'Vadodara', leadSource: 'Direct/Rep', leadStatus: 'Follow-up', createdAt: getTimestampAgo(0, 5), assignedToId: 'user-3', applicationStatus: 'Documents Collected', passportStatus: 'With Agency', documents: [] },
  { id: 'lead-6', name: 'CA Vinod Mahapatra', phone: '9015639535', email: 'Vkmahapatra3@gmail.com', service: 'Dubai Visit Visa', location: 'Noida', leadSource: 'Google', leadStatus: 'Won', createdAt: getTimestampAgo(0, 6), assignedToId: 'user-3', applicationStatus: 'Application Lodged', passportStatus: 'Submitted to VFS/Embassy', documents: [] },
  { id: 'lead-7', name: 'Ashfaq Hussain', phone: '8492031019', email: 'ajazmalik8492@gmail.com', service: 'Saudi Work Visa', location: 'Mahore', leadSource: 'IVR', leadStatus: 'New Lead', createdAt: getTimestampAgo(0, 8), assignedToId: 'user-4', applicationStatus: 'Documents Pending', passportStatus: 'With Client', documents: [] },
  
  // --- YESTERDAY'S LEADS ---
  { id: 'lead-8', name: 'Manpreet Singh', phone: '7973752683', email: 'gavydhanjal90@gmail.com', service: 'Singapore Tourist Visa (2 days)', location: 'Batala', leadSource: 'Website Inquiry', leadStatus: 'Follow-up', createdAt: getDateAgo(1), lastActivityAt: getTimestampAgo(1, 2), assignedToId: 'user-4', applicationStatus: 'Documents Pending', passportStatus: 'With Client', documents: [] },
  { id: 'lead-9', name: 'Manoj Kumar', phone: '+971509524623', email: 'mk7313779@gmail.com', service: 'Singapore S-Pass', location: 'Dubai', leadSource: 'Social Media', leadStatus: 'Lost', createdAt: getDateAgo(1), assignedToId: 'user-5', applicationStatus: 'Documents Pending', passportStatus: 'With Client', documents: [] },
  { id: 'lead-10', name: 'Tanya Nandkeoliar', phone: '9891725253', email: 'tanya.nandkeoliar@gmail.com', service: 'Singapore Visa (March Travel)', location: 'Imphal', leadSource: 'Google', leadStatus: 'Follow-up', createdAt: getDateAgo(1), lastActivityAt: getTimestampAgo(1, 5), assignedToId: 'user-5', applicationStatus: 'Documents Pending', passportStatus: 'With Client', documents: [] },
  { id: 'lead-11', name: 'Shreenivas R A', phone: '8879673546', email: 'mktg@chemseals.com', service: 'Nigeria Business Visa', location: 'Mumbai', leadSource: 'Direct/Rep', leadStatus: 'New Lead', createdAt: getDateAgo(1), assignedToId: 'user-6', applicationStatus: 'Documents Pending', passportStatus: 'With Client', documents: [] },
  { id: 'lead-12', name: 'Sanjay Kumar Singh', phone: '08626084406', email: 'captsanjayks@yahoo.in', service: 'China Business/Tourist Visa', location: 'Pune', leadSource: 'Website Inquiry', leadStatus: 'New Lead', createdAt: getDateAgo(1), assignedToId: 'user-6', applicationStatus: 'Documents Pending', passportStatus: 'With Client', documents: [] },
  
  // --- OLDER LEADS (Last 3-7 Days) ---
  { id: 'lead-13', name: 'Anjali Kundal', phone: '7051099562', email: 'jagadishkumad453@gmail.com', service: 'UK Work Visa', location: 'Pathankot', leadSource: 'IVR', leadStatus: 'Follow-up', createdAt: getDateAgo(2), assignedToId: 'user-7', applicationStatus: 'Documents Pending', passportStatus: 'With Client', documents: [] },
  { id: 'lead-14', name: 'Kavita Agrawal', phone: '09836452228', email: 'kchamaria1993@gmail.com', service: 'Singapore Tourist Visa', location: 'Bambolim', leadSource: 'Google', leadStatus: 'Won', createdAt: getDateAgo(2), assignedToId: 'user-7', applicationStatus: 'Visa Approved', passportStatus: 'Dispatched to Client', documents: [] },
  { id: 'lead-15', name: 'Mohammad Nur Alam', phone: '7250747665', email: 'nuraalam3390953@gmail.com', service: 'Dubai/Saudi Process', location: 'Muzaffarpur', leadSource: 'IVR', leadStatus: 'New Lead', createdAt: getDateAgo(3), assignedToId: 'user-8', applicationStatus: 'Documents Pending', passportStatus: 'With Client', documents: [] },
  { id: 'lead-16', name: 'Sandeep R Singh', phone: '7599999447', email: 'sandeep.rs@smilephile.in', service: 'China Visa', location: 'Ahmedabad', leadSource: 'Website Inquiry', leadStatus: 'Follow-up', createdAt: getDateAgo(3), assignedToId: 'user-8', applicationStatus: 'Application Lodged', passportStatus: 'Submitted to VFS/Embassy', documents: [] },
  { id: 'lead-17', name: 'Jay Kathuria', phone: '7275824750', email: 'rahulbeast26@gmail.com', service: 'China Single Entry', location: 'Varanasi', leadSource: 'Website Inquiry', leadStatus: 'Won', createdAt: getDateAgo(3), assignedToId: 'user-9', applicationStatus: 'Passport Dispatched', passportStatus: 'Dispatched to Client', documents: [] },
  { id: 'lead-18', name: 'Nandini Alagar', phone: '8608657782', email: 'freelanceprojects60@gmail.com', service: 'Singapore Tourist Visa', location: 'Trichy', leadSource: 'Google', leadStatus: 'Follow-up', createdAt: getDateAgo(4), assignedToId: 'user-9', applicationStatus: 'Documents Collected', passportStatus: 'With Agency', documents: [] },
  { id: 'lead-19', name: 'Anush Kumar', phone: '78029034432', email: 'anushkumar23@gmail.com', service: 'Saudi E-Visa (7 Pax)', location: 'Bangalore', leadSource: 'Direct/Rep', leadStatus: 'New Lead', createdAt: getDateAgo(4), assignedToId: 'user-10', applicationStatus: 'Documents Pending', passportStatus: 'With Client', documents: [] },
  { id: 'lead-20', name: 'Vijay Sherigar', phone: '8433556911', email: 'vijsheri@gmail.com', service: 'Schengen Business Visa', location: 'Mumbai', leadSource: 'Google', leadStatus: 'Follow-up', createdAt: getDateAgo(4), assignedToId: 'user-10', applicationStatus: 'Documents Pending', passportStatus: 'With Client', documents: [] },
  { id: 'lead-21', name: 'Sujeet Mishra', phone: '07047869000', email: 'sujeetmishra09@gmail.com', service: 'Singapore Visa', location: 'Lucknow', leadSource: 'IVR', leadStatus: 'Won', createdAt: getDateAgo(5), assignedToId: 'user-1', applicationStatus: 'Visa Approved', passportStatus: 'Dispatched to Client', documents: [] },
  { id: 'lead-22', name: 'Farhad Dalvi', phone: '8180918443', email: 'dalvifarhad0@gmail.com', service: 'Saudi Family Visa', location: 'Navi Mumbai', leadSource: 'Direct/Rep', leadStatus: 'New Lead', createdAt: getDateAgo(5), assignedToId: 'user-1', applicationStatus: 'Documents Pending', passportStatus: 'With Client', documents: [] },
  { id: 'lead-23', name: 'Chhaya', phone: '9306425365', email: 'rchhaya023@gmail.com', service: 'Singapore Work Permit', location: 'Gurgaon', leadSource: 'Social Media', leadStatus: 'New Lead', createdAt: getDateAgo(5), assignedToId: 'user-2', applicationStatus: 'Documents Pending', passportStatus: 'With Client', documents: [] },
  { id: 'lead-24', name: 'Aditya Singh', phone: 'N/A', email: 'snghaditya@gmail.com', service: 'UK Visitor Visa (4 Pax)', location: 'N/A', leadSource: 'Website Inquiry', leadStatus: 'Follow-up', createdAt: getDateAgo(6), assignedToId: 'user-2', applicationStatus: 'Documents Pending', passportStatus: 'With Client', documents: [] },
  { id: 'lead-25', name: 'Sandeep Pooniya', phone: '9711065456', email: 'sandeeppooniya@gmail.com', service: 'Schengen Visa (Family)', location: 'Mandawa', leadSource: 'Google', leadStatus: 'New Lead', createdAt: getDateAgo(6), assignedToId: 'user-3', applicationStatus: 'Documents Pending', passportStatus: 'With Client', documents: [] },
  { id: 'lead-26', name: 'Maitry Paul', phone: '9874496949', email: 'lucypaul00@gmail.com', service: 'Singapore Visa', location: 'Kolkata', leadSource: 'Direct/Rep', leadStatus: 'Follow-up', createdAt: getDateAgo(6), assignedToId: 'user-3', applicationStatus: 'Documents Collected', passportStatus: 'With Agency', documents: [] },
  { id: 'lead-27', name: 'Pankaj Tiwari', phone: '6209554104', email: 'pankajtiwari9906@gmail.com', service: 'General Visa Inquiry', location: 'West Champaran', leadSource: 'IVR', leadStatus: 'New Lead', createdAt: getDateAgo(7), assignedToId: 'user-4', applicationStatus: 'Documents Pending', passportStatus: 'With Client', documents: [] },
  { id: 'lead-28', name: 'Shanawaz Khan', phone: '+918121843144', email: 'kshanawaz324@gmail.com', service: 'Saudi Work Visa', location: 'Nirmal', leadSource: 'Agent', leadStatus: 'Lost', createdAt: getDateAgo(7), assignedToId: 'user-4', applicationStatus: 'Documents Pending', passportStatus: 'With Client', documents: [] },
  { id: 'lead-29', name: 'Shreedhar Vyas', phone: '9601686770', email: 'sjv1887@gmail.com', service: 'Singapore Tourist Visa', location: 'Vadodara', leadSource: 'Google', leadStatus: 'Follow-up', createdAt: getDateAgo(7), assignedToId: 'user-5', applicationStatus: 'Documents Pending', passportStatus: 'With Client', documents: [] },
  { id: 'lead-30', name: 'I Dsouza', phone: '7715900448', email: 'I17souza@yahoo.com', service: 'Saudi Visa (Feb 2026)', location: 'Mumbai', leadSource: 'Google', leadStatus: 'New Lead', createdAt: getDateAgo(7), assignedToId: 'user-5', applicationStatus: 'Documents Pending', passportStatus: 'With Client', documents: [] },
  { id: 'lead-31', name: 'Mayur Taware', phone: '8767848655', email: 'tawaremayur73@gmail.com', service: 'Singapore Work Visa', location: 'Bharuch', leadSource: 'Social Media', leadStatus: 'New Lead', createdAt: getDateAgo(8), assignedToId: 'user-6', applicationStatus: 'Documents Pending', passportStatus: 'With Client', documents: [] },
  { id: 'lead-32', name: 'Srishti Rajeev Kaushal', phone: '9167057170', email: 'srishtikaushal100@gmail.com', service: 'Singapore Tourist Visa', location: 'Pune', leadSource: 'Website Inquiry', leadStatus: 'Follow-up', createdAt: getDateAgo(8), assignedToId: 'user-6', applicationStatus: 'Documents Collected', passportStatus: 'With Agency', documents: [] },
  { id: 'lead-33', name: 'Raj राजेंद्र Singh', phone: '7413080400', email: 'rajbanna4550@gmail.com', service: 'Bangladesh Visa', location: 'Jaipur', leadSource: 'Direct/Rep', leadStatus: 'New Lead', createdAt: getDateAgo(8), assignedToId: 'user-7', applicationStatus: 'Documents Pending', passportStatus: 'With Client', documents: [] },
  { id: 'lead-34', name: 'Hemant Sharma', phone: '9630609222', email: 'hs3979799@gmail.com', service: 'UK Work Permit', location: 'Gwalior', leadSource: 'Google', leadStatus: 'Lost', createdAt: getDateAgo(8), assignedToId: 'user-7', applicationStatus: 'Documents Pending', passportStatus: 'With Client', documents: [] },
  { id: 'lead-35', name: 'Chandan Onsker', phone: '7022001410', email: 'onsker@gmail.com', service: 'Singapore Tourism Visa', location: 'Bangalore', leadSource: 'Google', leadStatus: 'Follow-up', createdAt: getDateAgo(9), assignedToId: 'user-8', applicationStatus: 'Documents Pending', passportStatus: 'With Client', documents: [] },
  { id: 'lead-36', name: 'Sneha', phone: '9025673392', email: 'snhragu@gmail.com', service: 'Singapore Tourist Visa', location: 'Tamil Nadu', leadSource: 'Google', leadStatus: 'New Lead', createdAt: getDateAgo(9), assignedToId: 'user-8', applicationStatus: 'Documents Pending', passportStatus: 'With Client', documents: [] },
];


export const mockLeadNotes: LeadNote[] = [
    { id: 'note-1', leadId: 'lead-1', content: 'Client asking for express processing charges.', createdAt: getTimestampAgo(0, 1), author: 'Jyoti Sharma' },
    { id: 'note-2', leadId: 'lead-4', content: 'Requested flight itinerary for visa application.', createdAt: getTimestampAgo(0, 2), author: 'Lakshay Chaudhary' },
    { id: 'note-3', leadId: 'lead-6', content: 'Visa lodged successfully. Waiting for embassy update.', createdAt: getTimestampAgo(0, 4), author: 'Kartik Tyagi' },
    { id: 'note-4', leadId: 'lead-14', content: 'Client traveling next month. Urgent processing.', createdAt: getDateAgo(1), author: 'Rama Jain' },
    { id: 'note-5', leadId: 'lead-17', content: 'China visa approved. Client happy.', createdAt: getDateAgo(2), author: 'Amit Patel' },
    { id: 'note-6', leadId: 'lead-21', content: 'Collected passport for stamping.', createdAt: getDateAgo(3), author: 'Jyoti Sharma' },
    { id: 'note-7', leadId: 'lead-24', content: 'Sent UK family visa checklist.', createdAt: getDateAgo(4), author: 'Lakshay Chaudhary' },
    { id: 'note-8', leadId: 'lead-33', content: 'Needs Bangladesh visa for wedding.', createdAt: getDateAgo(5), author: 'Rama Jain' },
];

export const mockLeadReminders: LeadReminder[] = [
    { id: 'lrem-1', leadId: 'lead-1', note: 'Call Vinit regarding Dubai visa docs', dueDate: getDateAgo(0), isCompleted: false }, // Due today
    { id: 'lrem-2', leadId: 'lead-4', note: 'Follow up with Vivek for Singapore itinerary', dueDate: getDateAgo(0), isCompleted: false },
    { id: 'lrem-3', leadId: 'lead-8', note: 'Confirm Manpreet travel dates', dueDate: getDateAgo(1), isCompleted: false },
    { id: 'lrem-4', leadId: 'lead-12', note: 'Send China business visa checklist to Sanjay', dueDate: getDateAgo(1), isCompleted: false },
    { id: 'lrem-5', leadId: 'lead-24', note: 'Call Aditya for UK family visa consultation', dueDate: getDateAgo(2), isCompleted: true },
];

export const mockApplicationStatuses: ApplicationStatusItem[] = [
    { id: 'as-1', name: 'Documents Pending' },
    { id: 'as-2', name: 'Documents Collected' },
    { id: 'as-3', name: 'Application Lodged' },
    { id: 'as-4', name: 'Biometrics Scheduled' },
    { id: 'as-5', name: 'Under Review' },
    { id: 'as-6', name: 'Additional Docs Requested' },
    { id: 'as-7', name: 'Decision Made' },
    { id: 'as-8', name: 'Passport Dispatched' },
    { id: 'as-9', name: 'Visa Approved' },
    { id: 'as-10', name: 'Visa Rejected' },
];

export const mockPassportStatuses: PassportStatusItem[] = [
    { id: 'ps-1', name: 'With Client' },
    { id: 'ps-2', name: 'With Agency' },
    { id: 'ps-3', name: 'Submitted to VFS/Embassy' },
    { id: 'ps-4', name: 'Returned from VFS/Embassy' },
    { id: 'ps-5', name: 'Dispatched to Client' },
];

export const mockDocumentTypes: DocumentType[] = [
    { id: 'dt-1', name: 'Passport Copy' },
    { id: 'dt-2', name: 'Visa Application Form' },
    { id: 'dt-3', name: 'Photograph' },
    { id: 'dt-4', name: 'Flight Itinerary' },
    { id: 'dt-5', name: 'Hotel Booking' },
    { id: 'dt-6', name: 'Bank Statement' },
    { id: 'dt-7', name: 'Invitation Letter' },
    { id: 'dt-8', name: 'Employment Letter' },
];

export const mockRemarkStatuses: RemarkStatus[] = [
    { id: 'rs-1', name: 'RNR' },
    { id: 'rs-2', name: 'Call Back Later' },
    { id: 'rs-3', name: 'Not Interested' },
    { id: 'rs-4', name: 'Interested' },
    { id: 'rs-5', name: 'Switch Off' },
];

export const mockServiceTypes: ServiceType[] = [
    { id: 'st-1', name: 'Visa' },
    { id: 'st-2', name: 'Flight' },
    { id: 'st-3', name: 'Hotel' },
    { id: 'st-4', name: 'Holiday Package' },
    { id: 'st-5', name: 'Travel Insurance' },
];

export const mockLostReasons: LostReason[] = [
    { id: 'lr-1', name: 'Price too high' },
    { id: 'lr-2', name: 'Competitor' },
    { id: 'lr-3', name: 'Changed Plans' },
    { id: 'lr-4', name: 'Visa Rejected' },
    { id: 'lr-5', name: 'No Response' },
];

export const mockSaleBy: SaleBy[] = [
  { id: 'sb-1', name: 'JYOTI', status: 'Active' },
  { id: 'sb-2', name: 'VARUN', status: 'Active' },
];

export const mockWorkedBy: WorkedBy[] = [
  { id: 'wb-1', name: 'JYOTI', status: 'Active' },
  { id: 'wb-2', name: 'VARUN', status: 'Active' },
];

export const mockCustomers: Customer[] = [
  { id: 'cust-1', customerId: 'CUST-001', name: 'Kavita Agrawal', email: 'kchamaria1993@gmail.com', phone: '09836452228', country: 'Singapore', companyName: '', gstNumber: '', location: 'Bambolim', vendorId: 'vendor-1', saleById: 'user-7', serviceType: 'Tourist Visa', closeDate: getDateAgo(2).split('T')[0], action: 'Visa approved. Flight tickets booked.', passportStatus: 'Dispatched to Client', createdAt: getDateAgo(2) },
  { id: 'cust-2', customerId: 'CUST-002', name: 'Sujeet Mishra', email: 'sujeetmishra09@gmail.com', phone: '07047869000', country: 'Singapore', companyName: '', gstNumber: '', location: 'Lucknow', vendorId: 'vendor-2', saleById: 'user-1', serviceType: 'Tourist Visa', closeDate: getDateAgo(5).split('T')[0], action: 'Departure on 4th.', passportStatus: 'With Client', createdAt: getDateAgo(5) },
  { id: 'cust-3', customerId: 'CUST-003', name: 'Jay Kathuria', email: 'rahulbeast26@gmail.com', phone: '7275824750', country: 'China', companyName: '', gstNumber: '', location: 'Varanasi', vendorId: 'vendor-3', saleById: 'user-9', serviceType: 'Single Entry Visa', closeDate: getDateAgo(3).split('T')[0], action: 'Visa processed.', passportStatus: 'Dispatched to Client', createdAt: getDateAgo(3) },
  { id: 'cust-4', customerId: 'CUST-004', name: 'CA Vinod Mahapatra', email: 'Vkmahapatra3@gmail.com', phone: '9015639535', country: 'UAE', companyName: '', gstNumber: '', location: 'Noida', vendorId: 'vendor-1', saleById: 'user-3', serviceType: 'Dubai Visit Visa', closeDate: getDateAgo(0).split('T')[0], action: 'Paid and processed.', passportStatus: 'With Client', createdAt: getDateAgo(0) },
  { id: 'cust-5', customerId: 'CUST-005', name: 'Shreenivas R A', email: 'mktg@chemseals.com', phone: '8879673546', country: 'Nigeria', companyName: 'Chemseals', gstNumber: '27AAAAA0000A1Z5', location: 'Mumbai', vendorId: 'vendor-2', saleById: 'user-6', serviceType: 'Business Visa', closeDate: getDateAgo(8).split('T')[0], action: 'Docs submitted.', passportStatus: 'With Agency', createdAt: getDateAgo(8) },
  { id: 'cust-6', customerId: 'CUST-006', name: 'Ashoka Munnippady Shankara', email: 'ashok.shankar@samsrishti.com', phone: '9870109662', country: 'China', companyName: 'Samsrishti', gstNumber: '', location: 'Mumbai', vendorId: 'vendor-3', saleById: 'user-8', serviceType: 'Business Visa', closeDate: getDateAgo(15).split('T')[0], action: 'Nanjing trip Jan 2026.', passportStatus: 'With Client', createdAt: getDateAgo(15) },
  { id: 'cust-7', customerId: 'CUST-007', name: 'Priya', email: 'priyasahani92@gmail.com', phone: '9869335239', country: 'Singapore', companyName: '', gstNumber: '', location: 'Mumbai', vendorId: 'vendor-1', saleById: 'user-2', serviceType: 'Urgent Visa', closeDate: getDateAgo(20).split('T')[0], action: 'Travelled on 11 Sept.', passportStatus: 'With Client', createdAt: getDateAgo(20) },
  { id: 'cust-8', customerId: 'CUST-008', name: 'Gaurav', email: 'gauravsharma2k13@gmail.com', phone: '8750789115', country: 'Germany', companyName: '', gstNumber: '', location: 'Gurgaon', vendorId: 'vendor-2', saleById: 'user-4', serviceType: 'Schengen Visa', closeDate: getDateAgo(25).split('T')[0], action: '2 weeks trip completed.', passportStatus: 'With Client', createdAt: getDateAgo(25) },
  { id: 'cust-9', customerId: 'CUST-009', name: 'Mayank Parmar', email: 'mykparmar007@gmail.com', phone: '8826049363', country: 'China', companyName: '', gstNumber: '', location: 'Ghaziabad', vendorId: 'vendor-3', saleById: 'user-5', serviceType: 'Tourist Visa', closeDate: getDateAgo(28).split('T')[0], action: 'Hong Kong to Mainland trip.', passportStatus: 'With Client', createdAt: getDateAgo(28) },
  { id: 'cust-10', customerId: 'CUST-010', name: 'Karan Singh', email: 'karansingh86@gmail.com', phone: '9999699675', country: 'Singapore', companyName: '', gstNumber: '', location: 'Gurgaon', vendorId: 'vendor-1', saleById: 'user-6', serviceType: 'Group Visa (5 Pax)', closeDate: getDateAgo(30).split('T')[0], action: 'Family trip.', passportStatus: 'With Client', createdAt: getDateAgo(30) },
  { id: 'cust-11', customerId: 'CUST-011', name: 'Rishav Roy', email: 'royrishav697@gmail.com', phone: '9874044240', country: 'Singapore', companyName: '', gstNumber: '', location: 'Kolkata', vendorId: 'vendor-2', saleById: 'user-1', serviceType: 'Tourist Visa', closeDate: getDateAgo(35).split('T')[0], action: 'Closed.', passportStatus: 'With Client', createdAt: getDateAgo(35) },
  { id: 'cust-12', customerId: 'CUST-012', name: 'Surbhi Bhandari', email: 'surbhibhandari07@gmail.com', phone: '9602226256', country: 'France', companyName: '', gstNumber: '', location: 'Gurugram', vendorId: 'vendor-3', saleById: 'user-2', serviceType: 'Schengen Visa', closeDate: getDateAgo(40).split('T')[0], action: 'Sept trip.', passportStatus: 'With Client', createdAt: getDateAgo(40) },
  { id: 'cust-13', customerId: 'CUST-013', name: 'Amit Bishayi', email: 'akbishayi@gmail.com', phone: '09717779078', country: 'Australia', companyName: '', gstNumber: '', location: 'Bhiwadi', vendorId: 'vendor-1', saleById: 'user-3', serviceType: 'Tourist Visa', closeDate: getDateAgo(45).split('T')[0], action: 'For daughter.', passportStatus: 'With Client', createdAt: getDateAgo(45) },
  { id: 'cust-14', customerId: 'CUST-014', name: 'Prashant Saxena', email: 'prashant23saxena@gmail.com', phone: '9650629024', country: 'Singapore', companyName: '', gstNumber: '', location: 'Gurgaon', vendorId: 'vendor-2', saleById: 'user-4', serviceType: 'Clarifications & Visa', closeDate: getDateAgo(50).split('T')[0], action: 'Closed.', passportStatus: 'With Client', createdAt: getDateAgo(50) },
  { id: 'cust-15', customerId: 'CUST-015', name: 'Jasmin Caron Santhmayor', email: 'santhmayor.jasmin@gmail.com', phone: '7406212441', country: 'Saudi Arabia', companyName: '', gstNumber: '', location: 'Mangalore', vendorId: 'vendor-3', saleById: 'user-5', serviceType: 'Tourist Visa', closeDate: getDateAgo(55).split('T')[0], action: 'Closed.', passportStatus: 'With Client', createdAt: getDateAgo(55) },
];

export const mockInvoices: Invoice[] = [
    { id: 'inv-001', customerId: 'cust-1', customerName: 'Kavita Agrawal', amount: 4500, issuedDate: getDateAgo(2).split('T')[0], dueDate: getDateAgo(12).split('T')[0], status: InvoiceStatus.PAID },
    { id: 'inv-002', customerId: 'cust-2', customerName: 'Sujeet Mishra', amount: 3800, issuedDate: getDateAgo(5).split('T')[0], dueDate: getDateAgo(15).split('T')[0], status: InvoiceStatus.PAID },
    { id: 'inv-003', customerId: 'cust-3', customerName: 'Jay Kathuria', amount: 12000, issuedDate: getDateAgo(3).split('T')[0], dueDate: getDateAgo(13).split('T')[0], status: InvoiceStatus.SENT },
    { id: 'inv-004', customerId: 'cust-4', customerName: 'CA Vinod Mahapatra', amount: 7500, issuedDate: getDateAgo(0).split('T')[0], dueDate: getDateAgo(10).split('T')[0], status: InvoiceStatus.DRAFT },
    { id: 'inv-005', customerId: 'cust-10', customerName: 'Karan Singh', amount: 18500, issuedDate: getDateAgo(30).split('T')[0], dueDate: getDateAgo(20).split('T')[0], status: InvoiceStatus.PAID },
];

export const mockMessages: ChatMessage[] = [
    { id: 'msg-1', senderId: 'user-2', receiverId: 'user-1', content: 'Hey Jyoti, did Vinit send the documents for Dubai visa?', timestamp: getTimestampAgo(0, 1), isRead: true },
    { id: 'msg-2', senderId: 'user-1', receiverId: 'user-2', content: 'Yes, just received them. Processing now.', timestamp: getTimestampAgo(0, 0, 30), isRead: false },
];

export const mockCompanyDetails: CompanyDetails = {
    companyName: 'Lumina Travels',
    address: '123 Travel Lane',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    pincode: '110001',
    fromName: 'Lumina Support',
    fromEmail: 'support@luminatravels.com',
    replyName: 'Lumina Info',
    replyEmail: 'info@luminatravels.com',
    helpEmail: 'help@luminatravels.com',
    infoEmail: 'info@luminatravels.com',
    phone: '9876543210',
    secondaryPhone: '9876543211',
    instagramLink: 'https://instagram.com/luminatravels',
    facebookLink: 'https://facebook.com/luminatravels',
    twitterLink: 'https://twitter.com/luminatravels',
    linkedinLink: 'https://linkedin.com/company/luminatravels',
    website: 'https://luminatravels.com',
    gstNo: '07AAAAA0000A1Z5',
    timezone: '(GMT+05:30) India Standard Time (Asia/Kolkata)',
    dateFormat: 'dd-mm-yyyy',
    currency: 'INR',
};

export const mockAnnouncements: Announcement[] = [
    { id: 'ann-1', subject: 'China Visa Update', content: 'China has introduced new visa categories. Please check the portal.', recipients: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8', 'user-9', 'user-10'], scheduledAt: getTimestampAgo(1), authorId: 'user-6' },
];

export const mockEmailApiCredentials: EmailApiCredentials = {
    apiName: 'SendGrid',
    apiUrl: 'https://api.sendgrid.com/v3/mail/send',
    apiKey: 'SG.xxxxxxxxxxxxxxxxxxxx',
};

export const mockMobileApiCredentials: MobileApiCredentials = {
    apiName: 'Twilio',
    fromNumber: '+1234567890',
    sid: 'ACxxxxxxxxxxxxxxxxxxxx',
    token: 'xxxxxxxxxxxxxxxxxxxx',
};

export const mockPaymentGatewaySettings: PaymentGatewaySettings = {
    gatewayName: 'Razorpay',
    apiKey: 'rzp_test_xxxxxxxx',
    apiSecret: 'xxxxxxxx',
};

export const mockUserActivityLogs: UserActivityLog[] = [
    { id: 'log-1', userId: 'user-1', ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', loginDate: getTimestampAgo(0, 4), logoutDate: getTimestampAgo(0, 1), status: 'Logged Out', location: 'New Delhi, India' },
    { id: 'log-2', userId: 'user-1', ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', loginDate: getTimestampAgo(0, 0, 10), status: 'Logged In', location: 'New Delhi, India' },
];

export const mockSystemLogs: SystemLog[] = [
    { id: 'sys-1', userId: 'user-6', userName: 'Rajiv Gangwar', role: 'Super Admin', title: 'Updated Lead Status for Jay Kathuria', createdAt: getDateAgo(3) },
];

export const mockPermissionCategories: PermissionCategory[] = [
    { id: 'cat-1', title: 'Sales', status: 'Active' },
    { id: 'cat-2', title: 'Marketing', status: 'Active' },
    { id: 'cat-3', title: 'Accounts', status: 'Active' },
];

export const mockPermissionSections: PermissionSection[] = [
    { id: 'sec-1', title: 'Leads Management', category: 'Sales', status: 'Active' },
    { id: 'sec-2', title: 'Customer Management', category: 'Sales', status: 'Active' },
    { id: 'sec-3', title: 'Invoice Management', category: 'Accounts', status: 'Active' },
];

export const mockImportedLeadFiles: ImportedFile[] = [
    { id: 'file-1', fileName: 'december_leads.csv', totalLeads: 45, addedBy: 'Admin', createdAt: getDateAgo(2) },
];

export const mockNotifications: Notification[] = [
    { id: 'notif-1', userId: 'user-1', title: 'New Lead Assigned', content: 'You have been assigned a new lead: Vinit Doshi', createdAt: getTimestampAgo(0, 1), isRead: false, linkTo: '/leads/lead-1', icon: 'ri-user-add-line', iconColor: 'text-blue-500' },
];

export const mockEmails: Email[] = [
    { id: 'email-1', leadId: 'lead-4', from: 'Soni.vivekk26@gmail.com', to: 'support@luminatravels.com', subject: 'Visa Inquiry', body: 'How to get singapore tourist visa?', timestamp: getTimestampAgo(0, 4), type: 'incoming', isRead: true },
];

export const mockWhatsAppMessages: WhatsAppMessage[] = [
    { id: 'wa-1', leadId: 'lead-1', content: 'dubai visitor visa details please', timestamp: getTimestampAgo(0, 1), type: 'incoming', isRead: true },
];

export const mockQuotes: Quote[] = [
    { 
        id: 'quote-1', 
        leadId: 'lead-6', 
        quoteNumber: 'QT-LEAD-006', 
        createdAt: getDateAgo(0).split('T')[0], 
        validUntil: getDateAgo(-30).split('T')[0], 
        status: QuoteStatus.SENT, 
        items: [
            { id: 'item-1', description: 'Dubai 30 Days Visa', quantity: 1, price: 7500, total: 7500 }
        ], 
        subtotal: 7500, 
        tax: 0, 
        total: 7500 
    },
];

export const mockWorkflowRules: WorkflowRule[] = [
    {
        id: 'wf-1',
        name: 'New Lead Welcome',
        triggerModule: 'Lead',
        triggerEvent: 'updated',
        conditions: [{ field: 'leadStatus', value: 'New Lead' }],
        actionType: 'createReminder',
        actionDetails: { note: 'Send welcome email', dueInDays: 1 }
    }
];
