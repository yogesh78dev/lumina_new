
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCrm } from '../hooks/useCrm';
import { CompanyDetails, EmailApiCredentials, MobileApiCredentials, SystemLog } from '../types';
import UserManagement from '../components/settings/UserManagement';
import { useSwal } from '../hooks/useSwal';
import RoleManagement from '../components/settings/RoleManagement';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/common/Pagination';
import { useSorting } from '../hooks/useSorting';
import { capitalizeName } from '../utils/formatters';
import SearchInput from '../components/common/SearchInput';
import CRMConfiguration from '../components/settings/CRMConfiguration';
import Announcement from '../components/settings/Announcement';
import WorkflowAutomation from '../components/settings/WorkflowAutomation';
import SecurityControlsPage from '../components/settings/SecurityControlsPage';
import PaymentGatewaySettingsPage from '../components/settings/PaymentGatewaySettingsPage';
import PageContainer from '../components/layout/PageContainer';
import DataAdministrationPage from './DataAdministrationPage'; // Import the Data Page

const settingsConfig = [
    {
        name: 'General',
        items: [
            { id: 'company-details', name: 'Company Profile', icon: 'ri-building-4-line' },
            { id: 'sidebar-menu', name: 'Sidebar Menu', icon: 'ri-menu-fold-line' },
        ]
    },
    {
        name: 'Configuration',
        items: [
             { id: 'crm-config', name: 'Master Data', icon: 'ri-database-2-line' },
            //  { id: 'workflow', name: 'Workflow Automation', icon: 'ri-command-line' },
             { id: 'announcements', name: 'Announcements', icon: 'ri-notification-3-line' },
            //  { id: 'payment-gateway', name: 'Payment Gateway', icon: 'ri-bank-card-line' },
        ]
    },
    {
        name: 'User Management',
        items: [
            { id: 'users', name: 'Users', icon: 'ri-user-line' },
            { id: 'roles', name: 'Roles', icon: 'ri-shield-user-line' },
            // { id: 'security', name: 'Security Controls', icon: 'ri-lock-password-line' },
            { id: 'system-log', name: 'System Logs', icon: 'ri-history-line' },
        ]
    },
    {
        name: 'Data Management',
        items: [
            { id: 'data-import', name: 'Import Data', icon: 'ri-upload-cloud-2-line' },
            { id: 'data-export', name: 'Backup & Export', icon: 'ri-download-cloud-2-line' },
            { id: 'data-target', name: 'Set Targets', icon: 'ri-crosshair-2-line' },
        ]
    }
];

const DEFAULT_SIDEBAR_ORDER = ['dashboard', 'leads', 'customers', 'vendors', 'reminders', 'invoices', 'settings'];

const sidebarMenuItems: Record<string, { label: string; icon: string }> = {
    dashboard: { label: 'Dashboard', icon: 'ri-pie-chart-2-line' },
    leads: { label: 'Leads', icon: 'ri-group-2-line' },
    customers: { label: 'Customers', icon: 'ri-team-line' },
    vendors: { label: 'Vendors', icon: 'ri-store-2-line' },
    reminders: { label: 'Reminders', icon: 'ri-notification-3-line' },
    invoices: { label: 'Invoices', icon: 'ri-bill-line' },
    settings: { label: 'Settings', icon: 'ri-settings-3-line' }
};

const normalizeSidebarOrder = (order?: string[]) => {
    const savedOrder = Array.isArray(order) ? order : [];
    return [...savedOrder, ...DEFAULT_SIDEBAR_ORDER.filter(id => !savedOrder.includes(id))]
        .filter((id, index, arr) => sidebarMenuItems[id] && arr.indexOf(id) === index);
};

const CompanyDetailsForm = () => {
    const { companyDetails, updateCompanyDetails } = useCrm();
    const { fireToast } = useSwal();
    const [formData, setFormData] = useState<CompanyDetails | null>(companyDetails);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    // Data for dropdowns
    const timezones = [
        '(GMT+05:30) India Standard Time (Asia/Kolkata)',
        '(GMT-05:00) Eastern Time (US & Canada)',
        '(GMT+00:00) Greenwich Mean Time : Dublin, Edinburgh, Lisbon, London',
        '(GMT+01:00) Central European Time (Amsterdam, Berlin, Rome)',
        '(GMT+08:00) Singapore Standard Time (Asia/Singapore)',
        '(GMT+10:00) Eastern Australia Standard Time (Australia/Sydney)'
    ];
    const dateFormats = [
        'dd-mm-yyyy',
        'mm-dd-yyyy',
        'yyyy-mm-dd',
        'dd/mm/yyyy',
        'mm/dd/yyyy'
    ];
    const currencies = [
        { code: 'INR', symbol: '₹' },
        { code: 'USD', symbol: '$' },
        { code: 'EUR', symbol: '€' },
        { code: 'GBP', symbol: '£' },
    ];


    useEffect(() => {
        setFormData(companyDetails);
    }, [companyDetails]);

    if (!formData) return <div>Loading company details...</div>;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'faviconUrl') => {
        if (e.target.files && e.target.files[0] && formData) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, [field]: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData && !isSubmitting) {
            setIsSubmitting(true);
            try {
                await updateCompanyDetails(formData);
                fireToast('success', 'Company details updated successfully!');
            } catch (error: any) {
                fireToast('error', error.message || 'Failed to update company details.');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3 className="text-xl font-semibold mb-6">Company Details</h3>
            
            {/* Main Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                {/* Inputs for text fields */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Company Name<span className="text-red-500">*</span></label>
                    <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="e.g., Myway Destination" className="mt-1 input-field" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Address<span className="text-red-500">*</span></label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="e.g., 123 Travel Lane" className="mt-1 input-field" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">City<span className="text-red-500">*</span></label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="e.g., New Delhi" className="mt-1 input-field" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">State<span className="text-red-500">*</span></label>
                    <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="e.g., Delhi" className="mt-1 input-field" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="e.g., India" className="mt-1 input-field" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Pincode<span className="text-red-500">*</span></label>
                    <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="e.g., 110026" className="mt-1 input-field" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">From Name<span className="text-red-500">*</span></label>
                    <input type="text" name="fromName" value={formData.fromName} onChange={handleChange} placeholder="Sender name for emails" className="mt-1 input-field" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">From Email<span className="text-red-500">*</span></label>
                    <input type="email" name="fromEmail" value={formData.fromEmail} onChange={handleChange} placeholder="e.g., noreply@example.com" className="mt-1 input-field" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Reply Name</label>
                    <input type="text" name="replyName" value={formData.replyName} onChange={handleChange} placeholder="Reply-to name for emails" className="mt-1 input-field" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Reply Email</label>
                    <input type="email" name="replyEmail" value={formData.replyEmail} onChange={handleChange} placeholder="e.g., info@example.com" className="mt-1 input-field" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Help Email</label>
                    <input type="email" name="helpEmail" value={formData.helpEmail} onChange={handleChange} placeholder="e.g., help@example.com" className="mt-1 input-field" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Info Email</label>
                    <input type="email" name="infoEmail" value={formData.infoEmail} onChange={handleChange} placeholder="e.g., general@example.com" className="mt-1 input-field" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Phone<span className="text-red-500">*</span></label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="e.g., 9953359977" className="mt-1 input-field" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Secondary Phone</label>
                    <input type="tel" name="secondaryPhone" value={formData.secondaryPhone} onChange={handleChange} placeholder="Alternative contact number" className="mt-1 input-field" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Instagram Link</label>
                    <input type="url" name="instagramLink" value={formData.instagramLink} onChange={handleChange} placeholder="https://instagram.com/..." className="mt-1 input-field" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Facebook Link</label>
                    <input type="url" name="facebookLink" value={formData.facebookLink} onChange={handleChange} placeholder="https://facebook.com/..." className="mt-1 input-field" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Twitter Link</label>
                    <input type="url" name="twitterLink" value={formData.twitterLink} onChange={handleChange} placeholder="https://twitter.com/..." className="mt-1 input-field" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Linkedin Link</label>
                    <input type="url" name="linkedinLink" value={formData.linkedinLink} onChange={handleChange} placeholder="https://linkedin.com/..." className="mt-1 input-field" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Website</label>
                    <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://example.com" className="mt-1 input-field" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">GST No.</label>
                    <input type="text" name="gstNo" value={formData.gstNo} onChange={handleChange} placeholder="e.g., 07ABCDE1234F1Z5" className="mt-1 input-field" />
                </div>
                
                {/* Dropdowns */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Timezone</label>
                    <select name="timezone" value={formData.timezone} onChange={handleChange} className="mt-1 input-field">
                        {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Date Format</label>
                    <select name="dateFormat" value={formData.dateFormat} onChange={handleChange} className="mt-1 input-field">
                        {dateFormats.map(df => <option key={df} value={df}>{df.toUpperCase()}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Currency</label>
                    <select name="currency" value={formData.currency} onChange={handleChange} className="mt-1 input-field">
                        {currencies.map(c => <option key={c.code} value={c.code}>{`${c.code} (${c.symbol})`}</option>)}
                    </select>
                </div>
            </div>

            {/* Logo and Favicon Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 pt-6 border-t">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                    <div className="flex items-start space-x-4">
                        <div className="w-24 h-24 border rounded-md flex items-center justify-center bg-gray-50 flex-shrink-0 group relative overflow-hidden">
                            {formData.logoUrl ? (
                                <>
                                    <img src={formData.logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                                    <button 
                                        type="button" 
                                        onClick={() => setFormData({...formData, logoUrl: ''})}
                                        className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <i className="ri-delete-bin-line text-xl"></i>
                                    </button>
                                </>
                            ) : (
                                <i className="ri-image-line text-3xl text-gray-300"></i>
                            )}
                        </div>
                        <div>
                            <input type="file" accept="image/*" ref={logoInputRef} onChange={(e) => handleFileChange(e, 'logoUrl')} className="hidden" />
                            <button type="button" onClick={() => logoInputRef.current?.click()} className="px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50 flex items-center">
                                <i className="ri-upload-2-line mr-2"></i>
                                Choose File
                            </button>
                            <p className="text-xs text-gray-500 mt-2">Recommended size: 200x50 pixels. Max size: 2MB.</p>
                        </div>
                    </div>
                </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Favicon</label>
                     <div className="flex items-start space-x-4">
                        <div className="w-24 h-24 border rounded-md flex items-center justify-center bg-gray-50 flex-shrink-0 group relative overflow-hidden">
                            {formData.faviconUrl ? (
                                <>
                                    <img src={formData.faviconUrl} alt="Favicon Preview" className="max-w-full max-h-full object-contain" />
                                    <button 
                                        type="button" 
                                        onClick={() => setFormData({...formData, faviconUrl: ''})}
                                        className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <i className="ri-delete-bin-line text-xl"></i>
                                    </button>
                                </>
                            ) : (
                                <i className="ri-image-line text-3xl text-gray-300"></i>
                            )}
                        </div>
                        <div>
                            <input type="file" accept="image/png, image/x-icon" ref={faviconInputRef} onChange={(e) => handleFileChange(e, 'faviconUrl')} className="hidden" />
                            <button type="button" onClick={() => faviconInputRef.current?.click()} className="px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50 flex items-center">
                                <i className="ri-upload-2-line mr-2"></i>
                                Choose File
                            </button>
                            <p className="text-xs text-gray-500 mt-2">Recommended size: 32x32 pixels. File type: .ico or .png</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-2 mt-8 pt-4 border-t">
                <button type="button" onClick={() => setFormData(companyDetails)} disabled={isSubmitting} className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-70 flex items-center gap-2">
                    {isSubmitting ? <><i className="ri-loader-4-line animate-spin"></i> Saving...</> : 'Submit Details'}
                </button>
            </div>
        </form>
    );
};

const SidebarMenuSettings = () => {
    const { companyDetails, updateCompanyDetails, currentUser } = useCrm();
    const { fireToast } = useSwal();
    const [order, setOrder] = useState<string[]>(normalizeSidebarOrder(companyDetails.sidebarOrder));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSuperAdmin = currentUser?.role === 'Super Admin';

    useEffect(() => {
        setOrder(normalizeSidebarOrder(companyDetails.sidebarOrder));
    }, [companyDetails.sidebarOrder]);

    const moveItem = (index: number, direction: -1 | 1) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= order.length) return;
        const nextOrder = [...order];
        [nextOrder[index], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[index]];
        setOrder(nextOrder);
    };

    const handleReset = () => {
        setOrder(DEFAULT_SIDEBAR_ORDER);
    };

    const handleSave = async () => {
        if (!isSuperAdmin || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await updateCompanyDetails({ ...companyDetails, sidebarOrder: order });
            fireToast('success', 'Sidebar order updated successfully!');
        } catch (error: any) {
            fireToast('error', error.message || 'Failed to update sidebar order.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isSuperAdmin) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-800">Sidebar Menu</h3>
                <p className="text-sm text-gray-500 mt-2">Only Super Admin can manage sidebar order.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800">Sidebar Menu</h3>
                    <p className="text-sm text-gray-500 mt-1">Arrange how modules appear in the main sidebar for all users.</p>
                </div>
                <button
                    type="button"
                    onClick={handleReset}
                    disabled={isSubmitting}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                    Reset Default
                </button>
            </div>

            <div className="border rounded-lg overflow-hidden divide-y">
                {order.map((id, index) => {
                    const item = sidebarMenuItems[id];
                    if (!item) return null;
                    return (
                        <div key={id} className="flex items-center justify-between gap-4 p-4 bg-white">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-8 h-8 rounded-md bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-semibold">
                                    {index + 1}
                                </span>
                                <i className={`${item.icon} text-xl text-primary`}></i>
                                <span className="font-medium text-gray-800 truncate">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => moveItem(index, -1)}
                                    disabled={index === 0 || isSubmitting}
                                    className="w-9 h-9 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="Move up"
                                >
                                    <i className="ri-arrow-up-line"></i>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => moveItem(index, 1)}
                                    disabled={index === order.length - 1 || isSubmitting}
                                    className="w-9 h-9 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="Move down"
                                >
                                    <i className="ri-arrow-down-line"></i>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <button
                    type="button"
                    onClick={() => setOrder(normalizeSidebarOrder(companyDetails.sidebarOrder))}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-70 flex items-center gap-2"
                >
                    {isSubmitting ? <><i className="ri-loader-4-line animate-spin"></i> Saving...</> : 'Save Order'}
                </button>
            </div>
        </div>
    );
};

const EmailApiForm = () => {
    const { emailApiCredentials, updateEmailApiCredentials } = useCrm();
    const { fireToast } = useSwal();
    const [formData, setFormData] = useState<EmailApiCredentials | null>(emailApiCredentials);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setFormData(emailApiCredentials);
    }, [emailApiCredentials]);

    if (!formData) return <div>Loading...</div>;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(formData) {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(formData && !isSubmitting){
            setIsSubmitting(true);
            try {
                await updateEmailApiCredentials(formData);
                fireToast('success', 'Email API credentials updated!');
            } catch (error: any) {
                fireToast('error', error.message || 'Failed to update email credentials.');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3 className="text-xl font-semibold mb-6">Email API Credential</h3>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email API Name <span className="text-red-500">*</span></label>
                        <input type="text" name="apiName" value={formData.apiName} onChange={handleChange} disabled={isSubmitting} className="mt-1 input-field" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">API Url <span className="text-red-500">*</span></label>
                        <input type="text" name="apiUrl" value={formData.apiUrl} onChange={handleChange} disabled={isSubmitting} className="mt-1 input-field" required />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">API Key <span className="text-red-500">*</span></label>
                    <input type="password" name="apiKey" value={formData.apiKey} onChange={handleChange} disabled={isSubmitting} className="mt-1 input-field" required />
                </div>
            </div>
            <div className="flex justify-start mt-8 pt-4 border-t">
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-70 flex items-center gap-2">
                    {isSubmitting ? <><i className="ri-loader-4-line animate-spin"></i> Saving... </> : 'Submit Details'}
                </button>
            </div>
        </form>
    );
};

const MobileApiForm = () => {
    const { mobileApiCredentials, updateMobileApiCredentials } = useCrm();
    const { fireToast } = useSwal();
    const [formData, setFormData] = useState<MobileApiCredentials | null>(mobileApiCredentials);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setFormData(mobileApiCredentials);
    }, [mobileApiCredentials]);

    if (!formData) return <div>Loading...</div>;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(formData){
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(formData && !isSubmitting){
            setIsSubmitting(true);
            try {
                await updateMobileApiCredentials(formData);
                fireToast('success', 'Mobile API credentials updated!');
            } catch (error: any) {
                fireToast('error', error.message || 'Failed to update mobile credentials.');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3 className="text-xl font-semibold mb-6">Mobile API Credential</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Mobile API Name <span className="text-red-500">*</span></label>
                    <input type="text" name="apiName" value={formData.apiName} onChange={handleChange} disabled={isSubmitting} className="mt-1 input-field" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">From Number <span className="text-red-500">*</span></label>
                    <input type="text" name="fromNumber" value={formData.fromNumber} onChange={handleChange} disabled={isSubmitting} className="mt-1 input-field" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">SID <span className="text-red-500">*</span></label>
                    <input type="text" name="sid" value={formData.sid} onChange={handleChange} disabled={isSubmitting} className="mt-1 input-field" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Token <span className="text-red-500">*</span></label>
                    <input type="password" name="token" value={formData.token} onChange={handleChange} disabled={isSubmitting} className="mt-1 input-field" required />
                </div>
            </div>
            <div className="flex justify-start mt-8 pt-4 border-t">
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-70 flex items-center gap-2">
                    {isSubmitting ? <><i className="ri-loader-4-line animate-spin"></i> Saving... </> : 'Submit Details'}
                </button>
            </div>
        </form>
    );
};

const SystemLogPage: React.FC = () => {
    const { systemLogs, users, roles } = useCrm();

    const [filters, setFilters] = useState({
        userId: '',
        role: '',
        startDate: '',
        endDate: '',
    });
    const [searchTerm, setSearchTerm] = useState('');

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const resetFilters = () => {
        setFilters({ userId: '', role: '', startDate: '', endDate: '' });
        setSearchTerm('');
    };

    const filteredLogs = useMemo(() => {
        return systemLogs.filter(log => {
            if (!log.createdAt) return false;
            const logDate = new Date(log.createdAt);

            if (filters.startDate) {
                const startDate = new Date(filters.startDate);
                startDate.setHours(0, 0, 0, 0);
                if (logDate < startDate) return false;
            }
            if (filters.endDate) {
                const endDate = new Date(filters.endDate);
                endDate.setHours(23, 59, 59, 999);
                if (logDate > endDate) return false;
            }
            if (filters.userId && log.userId !== filters.userId) return false;
            if (filters.role && log.role !== filters.role) return false;
            
            const searchLower = searchTerm.toLowerCase();
            if (searchLower && !(
                log.userName.toLowerCase().includes(searchLower) ||
                log.title.toLowerCase().includes(searchLower) ||
                log.role.toLowerCase().includes(searchLower)
            )) {
                return false;
            }
            return true;
        });
    }, [systemLogs, filters, searchTerm]);

    const { items: sortedLogs, requestSort, sortConfig } = useSorting<SystemLog>(filteredLogs, { key: 'createdAt', direction: 'descending' });
    
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
    } = usePagination(sortedLogs, 15);
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">System Activity Log</h3>

            <div className="p-4 mb-6 bg-gray-50 border rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="text-sm font-medium text-gray-600">User</label>
                        <select name="userId" value={filters.userId} onChange={handleFilterChange} className="mt-1 input-field">
                            <option value="">All Users</option>
                            {users.map(user => <option key={user.id} value={user.id}>{capitalizeName(user.name)}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-600">Role</label>
                        <select name="role" value={filters.role} onChange={handleFilterChange} className="mt-1 input-field">
                            <option value="">All Roles</option>
                            {roles.map(role => <option key={role.id} value={role.name}>{role.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-600">From Date</label>
                        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="mt-1 input-field" />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-600">To Date</label>
                        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="mt-1 input-field" />
                    </div>
                     <div className="lg:col-span-3">
                        <label className="text-sm font-medium text-gray-600">Search</label>
                        <div className="mt-1">
                            <SearchInput
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by user, role or action..."
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-transparent hidden sm:block">Reset</label>
                        <button onClick={resetFilters} className="w-full mt-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100">
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left font-semibold text-gray-600">S.No.</th>
                             <th className="p-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('userName')}>
                                <div className="flex items-center">User {sortConfig?.key === 'userName' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                            </th>
                            <th className="p-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('role')}>
                                <div className="flex items-center">Role {sortConfig?.key === 'role' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                            </th>
                            <th className="p-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('title')}>
                                <div className="flex items-center">Action {sortConfig?.key === 'title' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                            </th>
                            <th className="p-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('createdAt')}>
                                <div className="flex items-center">Date {sortConfig?.key === 'createdAt' ? (<i className={`ml-1 ${sortConfig.direction === 'ascending' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>) : (<i className="ml-1 text-gray-400 ri-arrow-up-down-line opacity-0 group-hover:opacity-100 transition-opacity"></i>)}</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {paginatedData.map((log: SystemLog, index) => (
                            <tr key={log.id}>
                                <td className="p-3">{startIndex + index}</td>
                                <td className="p-3 font-medium">{log.userName}</td>
                                <td className="p-3">{log.role}</td>
                                <td className="p-3">{log.title}</td>
                                <td className="p-3 text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                            </tr>
                        ))}
                         {paginatedData.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-10 text-gray-500">No logs found matching your criteria.</td>
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
    )
}


const SettingsContent: React.FC<{ activeView: string }> = ({ activeView }) => {
    const [activeTab, setActiveTab] = useState('company-details');

    const TABS = [
        { id: 'company-details', name: 'Company Details' },
        { id: 'email-api', name: 'Email Api Credential' },
        { id: 'mobile-api', name: 'Mobile Api Credential' },
    ];
    
    const renderContent = () => {
        switch (activeView) {
            case 'company-details':
                return (
                    <>
                        {activeTab === 'company-details' && <CompanyDetailsForm />}
                        {activeTab === 'email-api' && <EmailApiForm />}
                        {activeTab === 'mobile-api' && <MobileApiForm />}
                    </>
                );
            case 'sidebar-menu':
                return <SidebarMenuSettings />;
            case 'crm-config':
                return <CRMConfiguration />;
            case 'users':
                return <UserManagement />;
            case 'roles':
                 return <RoleManagement />;
            case 'workflow':
                return <WorkflowAutomation />;
            case 'announcements':
                return <Announcement />;
            case 'security':
                return <SecurityControlsPage />;
            case 'payment-gateway':
                return <PaymentGatewaySettingsPage />;
            case 'system-log':
                return <SystemLogPage />;
            case 'data-import':
                return <DataAdministrationPage activeView="import" />;
            case 'data-export':
                return <DataAdministrationPage activeView="export" />;
            case 'data-target':
                return <DataAdministrationPage activeView="target" />;
            default:
                return <div className="text-center text-gray-500 p-8">Select a setting to view.</div>;
        }
    };

    const isFullWidthPage = ['sidebar-menu', 'users', 'roles', 'system-log', 'crm-config', 'data-import', 'data-export', 'data-target', 'workflow', 'announcements', 'security', 'payment-gateway'].includes(activeView);
    
    if (isFullWidthPage) {
        return renderContent();
    }
    
    // Default tabbed layout for 'company-details'
    return (
        <div className="shadow-md rounded-lg bg-white">
            <div className="border-b border-gray-200">
                <nav className="px-4 sm:px-6 -mb-px flex flex-wrap" aria-label="Tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8 ${
                                activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="p-6">
                {renderContent()}
            </div>
        </div>
    );
};

const SettingsPage: React.FC = () => {
    const { currentUser } = useCrm();
    const isSuperAdmin = String(currentUser?.role || '').toLowerCase() === 'super admin';
    const [activeView, setActiveView] = useState(isSuperAdmin ? 'company-details' : 'crm-config');
    const [expandedCategory, setExpandedCategory] = useState<string | null>(isSuperAdmin ? 'General' : 'Configuration');

    const visibleSettingsConfig = useMemo(() => {
        if (isSuperAdmin) return settingsConfig;
        return settingsConfig.filter(category => category.name !== 'General');
    }, [isSuperAdmin]);

    useEffect(() => {
        if (!isSuperAdmin && activeView === 'company-details') {
            setActiveView('crm-config');
        }
    }, [activeView, isSuperAdmin]);

    const toggleCategory = (categoryName: string) => {
        setExpandedCategory(prev => (prev === categoryName ? null : categoryName));
    };

    return (
        <PageContainer>
        <div>
            <div className="flex flex-col md:flex-row gap-8">
                {/* Settings Sidebar */}
                <aside className="w-full md:w-64 lg:w-72 flex-shrink-0 self-start md:sticky top-6">
                    <div className="bg-white p-6 rounded-lg shadow-md space-y-2 max-h-[calc(100vh-8rem)] overflow-y-auto thin-scrollbar">
                        {visibleSettingsConfig.map(category => (
                            <div key={category.name}>
                                <button onClick={() => toggleCategory(category.name)} className="w-full flex justify-between items-center p-2 text-left font-semibold text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                                    {category.name}
                                    <i className={`ri-arrow-down-s-line transition-transform ${expandedCategory === category.name ? 'rotate-180' : ''}`}></i>
                                </button>
                                {expandedCategory === category.name && (
                                    <ul className="pl-2 mt-2 space-y-1">
                                        {category.items.map(item => (
                                            <li key={item.id}>
                                                <button 
                                                    onClick={() => setActiveView(item.id)}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center transition-colors ${activeView === item.id ? 'text-primary bg-primary/10 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
                                                >
                                                    <i className={`${item.icon} mr-3 w-5 text-center text-lg`}></i>
                                                    {item.name}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Content Area */}
                <main className="flex-grow min-w-0">
                    <SettingsContent activeView={activeView} />
                </main>
                <style>{`
                    .thin-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                    .thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .thin-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
                    .thin-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
                    .thin-scrollbar { scrollbar-width: thin; scrollbar-color: #d1d5db transparent; }
                    
                    .input-field {
                        display: block;
                        width: 100%;
                        border-radius: 0.375rem;
                        border: 1px solid #D1D5DB;
                        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                        font-size: 0.875rem;
                        line-height: 1.25rem;
                        padding: 0.5rem 0.75rem;
                    }
                    .input-field:focus {
                        outline: 2px solid transparent;
                        outline-offset: 2px;
                        border-color: #c4161c;
                        box-shadow: 0 0 0 1px #c4161c;
                    }
                `}</style>
            </div>
        </div>
        </PageContainer>
    );
};

export default SettingsPage;
