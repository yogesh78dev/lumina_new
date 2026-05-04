
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Customer, Vendor, User } from '../types';
import { useCrm } from '../hooks/useCrm';
import { useSwal } from '../hooks/useSwal';
import { allCountries } from '../utils/countries';
import { capitalizeName } from '../utils/formatters';
import PageContainer from '../components/layout/PageContainer';

const CustomerFormPage: React.FC = () => {
    const { customerId } = useParams<{ customerId: string }>();
    const navigate = useNavigate();
    const { getCustomerById, addCustomer, updateCustomer, vendors, users, openVendorModal, generateNextCustomerId, passportStatuses } = useCrm();
    const { fireToast } = useSwal();

    const isEditing = Boolean(customerId);

    const getInitialFormData = (currentVendors: Vendor[], currentUsers: User[]): Omit<Customer, 'id' | 'createdAt' | 'customerId'> => ({
        name: '',
        phone: '',
        email: '',
        country: 'India',
        companyName: '',
        gstNumber: '',
        location: '',
        vendorId: currentVendors[0]?.id || '',
        saleById: currentUsers[0]?.id || '',
        serviceType: '',
        closeDate: new Date().toISOString().split('T')[0],
        action: '',
        passportStatus: 'With Client',
    });

    const [formData, setFormData] = useState<Partial<Customer>>({});

    useEffect(() => {
        if (isEditing && customerId) {
            // Load existing customer data
            const existingCustomer = getCustomerById(customerId);
            if (existingCustomer) {
                setFormData({
                    ...existingCustomer,
                    closeDate: existingCustomer.closeDate ? new Date(existingCustomer.closeDate).toISOString().split('T')[0] : ''
                });
            } else {
                navigate('/customers');
            }
        } else {
            // Initialize New Customer only once
            if (!formData.customerId) {
                setFormData({
                    ...getInitialFormData(vendors, users),
                    customerId: generateNextCustomerId(),
                    passportStatus: passportStatuses[0]?.name || 'With Client'
                });
            }
        }
    }, [customerId, isEditing, getCustomerById, navigate, generateNextCustomerId]);

    // Handle Vendor dependency separately
    useEffect(() => {
        if (!isEditing && !formData.vendorId && vendors.length > 0) {
            setFormData(prev => ({ ...prev, vendorId: vendors[0].id }));
        }
    }, [vendors, isEditing, formData.vendorId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleClear = () => {
        setFormData({
            ...getInitialFormData(vendors, users),
            customerId: generateNextCustomerId(),
            passportStatus: passportStatuses[0]?.name || 'With Client'
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            const dataToSave = { ...formData };

            if (isEditing) {
                await updateCustomer(dataToSave as Customer);
                fireToast('success', 'Customer updated successfully!');
            } else {
                const { id, createdAt, ...restOfData } = dataToSave;
                await addCustomer(restOfData as Omit<Customer, 'id' | 'createdAt'>);
                fireToast('success', 'Customer created successfully!');
            }
            navigate('/customers');
        } catch (error: any) {
            console.error('Failed to save customer:', error);
            fireToast('error', error.message || 'Failed to save customer data.');
        }
    };

    const handleSaveAndNew = async () => {
        try {
            const dataToSave = { ...formData };
            const { id, createdAt, ...restOfData } = dataToSave;
            await addCustomer(restOfData as Omit<Customer, 'id' | 'createdAt'>);
            fireToast('success', 'Customer created successfully!');
            handleClear();
        } catch (error: any) {
            console.error('Failed to save customer:', error);
            fireToast('error', error.message || 'Failed to save customer data.');
        }
    };

    return (
        <PageContainer>
        <div className="container mx-auto max-w-6xl">
             <div className="mb-4">
                 <Link to="/customers" className="text-primary hover:underline text-sm flex items-center">
                    <i className="ri-arrow-left-line mr-2"></i>
                    Back to Customers
                </Link>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Client Information Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 border-b pb-3 mb-5 flex items-center gap-2">
                        <i className="ri-user-line text-primary"></i> Client Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Client Name <span className="text-primary">*</span></label>
                            <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="mt-1 input-field" required placeholder="Enter client name" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phone Number <span className="text-primary">*</span></label>
                            <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} className="mt-1 input-field" required placeholder="Enter phone number" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email Address</label>
                            <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="mt-1 input-field" placeholder="Enter email address" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Company Name</label>
                            <input type="text" name="companyName" value={formData.companyName || ''} onChange={handleChange} className="mt-1 input-field" placeholder="Enter company name" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">GST Number</label>
                            <input type="text" name="gstNumber" value={formData.gstNumber || ''} onChange={handleChange} className="mt-1 input-field" placeholder="Enter GST number" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Location</label>
                            <input type="text" name="location" value={formData.location || ''} onChange={handleChange} className="mt-1 input-field" placeholder="City or Region" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Country</label>
                            <select name="country" value={formData.country} onChange={handleChange} className="mt-1 input-field">
                                {allCountries.map(c => <option key={c.isoCode} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Service & Deal Details Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 border-b pb-3 mb-5 flex items-center gap-2">
                        <i className="ri-briefcase-line text-primary"></i> Service & Deal Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Customer ID</label>
                            <input type="text" name="customerId" value={formData.customerId || ''} className="mt-1 input-field bg-gray-50 text-gray-500 cursor-not-allowed" readOnly />
                        </div>
                        <div>
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-medium text-gray-700">Vendor</label>
                                <button type="button" onClick={() => openVendorModal(null)} className="text-xs font-medium text-primary hover:underline">+ New Vendor</button>
                            </div>
                            <select name="vendorId" value={formData.vendorId} onChange={handleChange} className="mt-1 input-field">
                            {vendors.length > 0 ? (
                                    vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)
                                ) : (
                                    <option disabled>Please add a vendor first</option>
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Sale By <span className="text-primary">*</span></label>
                            <select name="saleById" value={formData.saleById} onChange={handleChange} className="mt-1 input-field" required>
                                {users.map(u => <option key={u.id} value={u.id}>{capitalizeName(u.name)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Service Type <span className="text-primary">*</span></label>
                            <input type="text" name="serviceType" value={formData.serviceType || ''} onChange={handleChange} className="mt-1 input-field" required placeholder="e.g. Visa, Flight"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Close Date <span className="text-primary">*</span></label>
                            <input type="date" name="closeDate" value={formData.closeDate || ''} onChange={handleChange} className="mt-1 input-field" required/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Passport Status</label>
                            <select name="passportStatus" value={formData.passportStatus} onChange={handleChange} className="mt-1 input-field">
                                {passportStatuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                            <label className="block text-sm font-medium text-gray-700">Remarks / Action <span className="text-primary">*</span></label>
                            <textarea name="action" value={formData.action || ''} onChange={handleChange} rows={3} className="mt-1 input-field" required placeholder="Add any specific remarks or next actions..."></textarea>
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-2">
                    <button type="button" onClick={handleClear} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 text-sm shadow-sm transition-colors">
                        Clear Form
                    </button>
                    <button type="submit" className="px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 text-sm shadow-sm transition-colors">
                        {isEditing ? 'Update Details' : 'Submit Details'}
                    </button>
                    {!isEditing && (
                        <button type="button" onClick={handleSaveAndNew} className="px-6 py-2.5 bg-gray-900 text-white font-semibold rounded-lg hover:bg-black text-sm shadow-sm transition-colors">
                            Save & New
                        </button>
                    )}
                </div>
            </form>
             <style>{`
                .input-field {
                    display: block;
                    width: 100%;
                    border-radius: 0.5rem;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                    font-size: 0.875rem;
                    line-height: 1.25rem;
                    padding: 0.625rem 0.75rem;
                    transition: all 0.2s;
                }
                .input-field:focus {
                    outline: none;
                    border-color: #c4161c;
                    box-shadow: 0 0 0 3px rgba(196, 22, 28, 0.1);
                }
                .input-field:disabled, .input-field[readonly] {
                    background-color: #f9fafb;
                    color: #6b7280;
                }
            `}</style>
        </div>
        </PageContainer>
    );
};

export default CustomerFormPage;
