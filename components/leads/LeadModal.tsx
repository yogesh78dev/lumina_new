
import React, { useState, useEffect } from 'react';
import { Lead, User } from '../../types';
import { useCrm } from '../../hooks/useCrm';
import { allCountries } from '../../utils/countries';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: LeadFormData | Lead) => void;
  onSaveAndNew: (lead: LeadFormData) => void;
  lead: Lead | null;
}

interface LeadFormData extends Omit<Lead, 'id' | 'createdAt'> {
    createdAt?: string;
}

const initialFormData: LeadFormData = {
  name: '',
  phone: '',
  phone2: '',
  phone3: '',
  phone4: '',
  email: '',
  service: '',
  country: '',
  leadSource: '',
  leadStatus: '',
  companyName: '',
  location: '',
  remarks: '',
  // applicationStatus: '',
  // passportStatus: 'With Client',
  documents: [],
  assignedToId: '',
  createdAt: '',
};

const toInputDateValue = (value?: string) => {
  if (!value) return '';

  // If already in YYYY-MM-DD, keep it as-is to avoid timezone shifting.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  // Handle common DB datetime formats like "YYYY-MM-DD HH:mm:ss"
  if (/^\d{4}-\d{2}-\d{2}\s/.test(value)) {
    return value.slice(0, 10);
  }

  // Fallback for ISO values with timezone.
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const LeadModal: React.FC<LeadModalProps> = ({ isOpen, onClose, onSave, onSaveAndNew, lead }) => {
  const { leadSources, leadStatuses, users, currentUser } = useCrm();
  const [formData, setFormData] = useState<LeadFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdditionalPhones, setShowAdditionalPhones] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (lead) {
            setFormData({
                ...lead,
                assignedToId: lead.assignedToId || '',
                phone2: lead.phone2 || '',
                phone3: lead.phone3 || '',
                phone4: lead.phone4 || '',
                remarks: lead.latestNote || '',
                createdAt: toInputDateValue(lead.createdAt)
            });
            if (lead.phone2 || lead.phone3 || lead.phone4) {
                setShowAdditionalPhones(true);
            }
        } else {
            const isSuperAdmin = currentUser?.role === 'Super Admin';
            setFormData({
                ...initialFormData,
                country: 'India',
                leadSource: leadSources[0]?.name || '',
                leadStatus: leadStatuses[0]?.name || '',
                remarks: '',
                // applicationStatus: applicationStatuses[0]?.name || '',
                // passportStatus: passportStatuses[0]?.name || 'With Client',
                assignedToId: isSuperAdmin ? '' : (currentUser?.id || ''),
                createdAt: new Date().toISOString().split('T')[0]
            });
        }
        setIsSubmitting(false);
    }
  }, [lead, isOpen, leadSources, leadStatuses, currentUser]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleClear = () => {
      setFormData({
        ...initialFormData,
        country: 'India',
        leadSource: leadSources[0]?.name || '',
        leadStatus: leadStatuses[0]?.name || '',
        remarks: '',
        // applicationStatus: applicationStatuses[0]?.name || '',
        // passportStatus: passportStatuses[0]?.name || 'With Client',
        createdAt: new Date().toISOString().split('T')[0]
      });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
        await onSave(formData);
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleSaveAndNewClick = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
        await onSaveAndNew(formData);
        handleClear();
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[11000] flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 w-8 h-8 bg-gray-700 rounded-full text-white flex items-center justify-center hover:bg-gray-900 transition-transform duration-300 hover:rotate-90 z-10"
            aria-label="Close modal"
        >
            <i className="ri-close-line"></i>
        </button>
        <div className="p-6 border-b flex-shrink-0">
            <h3 className="text-xl font-semibold text-gray-800">{lead ? 'Edit Lead' : 'Create Lead'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name <span className="text-primary">*</span></label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number 1 <span className="text-primary">*</span></label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 input-field" required />
            </div>

            <div className="md:col-span-full">
                <button 
                    type="button" 
                    onClick={() => setShowAdditionalPhones(!showAdditionalPhones)}
                    className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline"
                >
                    <i className={showAdditionalPhones ? "ri-subtract-line" : "ri-add-line"}></i>
                    {showAdditionalPhones ? "Hide Additional Contact Numbers" : "Add More Contact Numbers (Up to 4)"}
                </button>
            </div>

            {showAdditionalPhones && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone Number 2</label>
                        <input type="tel" name="phone2" value={formData.phone2} onChange={handleChange} className="mt-1 input-field" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone Number 3</label>
                        <input type="tel" name="phone3" value={formData.phone3} onChange={handleChange} className="mt-1 input-field" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone Number 4</label>
                        <input type="tel" name="phone4" value={formData.phone4} onChange={handleChange} className="mt-1 input-field" />
                    </div>
                </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Service</label>
              <input type="text" name="service" value={formData.service} onChange={handleChange} className="mt-1 input-field" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <select name="country" value={formData.country} onChange={handleChange} className="mt-1 input-field">
                  {allCountries.map(c => <option key={c.isoCode} value={c.name}>{c.name}</option>)}
                </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} className="mt-1 input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="mt-1 input-field" />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Remarks</label>
              <textarea
                name="remarks"
                value={formData.remarks || ''}
                onChange={handleChange}
                rows={3}
                className="mt-1 input-field resize-y"
                placeholder="Add lead remarks..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Lead Source</label>
              <select name="leadSource" value={formData.leadSource} onChange={handleChange} className="mt-1 input-field">
                {leadSources.map(source => <option key={source.id} value={source.name}>{source.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Lead Status <span className="text-primary">*</span></label>
              <select name="leadStatus" value={formData.leadStatus} onChange={handleChange} className="mt-1 input-field" required>
                {leadStatuses.map(status => <option key={status.id} value={status.name}>{status.name}</option>)}
              </select>
            </div>
            {/* Application Status and Passport Status are intentionally hidden for now. */}
            <div className="md:col-span-1 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700">Assign To Agent</label>
                <select 
                    name="assignedToId" 
                    value={formData.assignedToId} 
                    onChange={handleChange} 
                    className="mt-1 input-field"
                    disabled={currentUser?.role !== 'Super Admin'}
                >
                    <option value="">-- Unassigned --</option>
                    {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                </select>
                {currentUser?.role !== 'Super Admin' && (
                    <p className="mt-1 text-xs text-gray-500 italic">Assigning restricted to Super Admins. Defaults to yourself or unassigned.</p>
                )}
            </div>
            <div className="md:col-span-1 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700">Lead Date (Manual Entry)</label>
                <input 
                    type="date" 
                    name="createdAt" 
                    value={formData.createdAt} 
                    onChange={handleChange} 
                    className="mt-1 input-field"
                />
                <p className="mt-1 text-[10px] text-gray-500 italic">Set this for backdated leads. Leave as today if not sure.</p>
            </div>
          </div>
          <div className="flex justify-end space-x-3 bg-gray-50 p-4 rounded-b-lg flex-shrink-0">
            <button type="button" onClick={handleClear} disabled={isSubmitting} className="px-5 py-2.5 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 text-sm disabled:opacity-50">
              Clear
            </button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 text-sm disabled:opacity-70 flex items-center gap-2">
              {isSubmitting ? <span className="flex items-center gap-2"><i className="ri-loader-4-line animate-spin"></i> Saving...</span> : 'Submit Details'}
            </button>
            {!lead && (
                 <button type="button" onClick={handleSaveAndNewClick} disabled={isSubmitting} className="px-5 py-2.5 bg-secondary text-white font-semibold rounded-lg hover:bg-black text-sm disabled:opacity-70">
                    {isSubmitting ? 'Saving...' : 'Save & New'}
                 </button>
            )}
          </div>
        </form>
      </div>
      <style>{`
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
            box-shadow: 0 0 0 2px #c4161c;
            z-index: 10;
            position: relative;
        }
      `}</style>
    </div>
  );
};

export default LeadModal;
