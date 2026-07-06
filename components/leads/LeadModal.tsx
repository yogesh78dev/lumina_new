
import React, { useState, useEffect, useMemo } from 'react';
import { Lead } from '../../types';
import { useCrm } from '../../hooks/useCrm';
import { allCountries } from '../../utils/countries';
import { getStatusVisual } from '../../utils/statusColors';

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
  leadType: '',
  leadCategory: '',
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
  const { leadSources, leadStatuses, leadCategories, serviceTypes, users, currentUser } = useCrm();
  const [formData, setFormData] = useState<LeadFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdditionalPhones, setShowAdditionalPhones] = useState(false);
  const selectedStatusVisual = useMemo(() => {
    const selectedStatus = leadStatuses.find(status => status.name === formData.leadStatus);
    return getStatusVisual(selectedStatus?.color);
  }, [leadStatuses, formData.leadStatus]);

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
                leadCategory: leadCategories[0]?.name || '',
                leadType: serviceTypes[0]?.name || '',
                leadSource: leadSources[0]?.name || '',
                leadStatus: leadStatuses[0]?.name || '',
                service: '',
                remarks: '',
                // applicationStatus: applicationStatuses[0]?.name || '',
                // passportStatus: passportStatuses[0]?.name || 'With Client',
                assignedToId: isSuperAdmin ? '' : (currentUser?.id || ''),
                createdAt: new Date().toISOString().split('T')[0]
            });
        }
        setIsSubmitting(false);
    }
  }, [lead, isOpen, leadSources, leadStatuses, leadCategories, serviceTypes, currentUser]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleClear = () => {
      setFormData({
        ...initialFormData,
        country: 'India',
        leadCategory: leadCategories[0]?.name || '',
        leadType: serviceTypes[0]?.name || '',
        leadSource: leadSources[0]?.name || '',
        leadStatus: leadStatuses[0]?.name || '',
        service: '',
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
    <div className="fixed inset-0 bg-slate-950/65 z-[11000] flex justify-center items-center p-2 sm:p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-7xl relative max-h-[96vh] flex flex-col overflow-hidden border border-white/40" onClick={e => e.stopPropagation()}>
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 bg-white flex items-center justify-between gap-4 flex-shrink-0">
            <div>
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-primary">{lead ? 'Lead Management' : 'New Opportunity'}</p>
                <h3 className="text-lg font-black text-slate-900 leading-tight">{lead ? 'Edit Lead' : 'Create Lead'}</h3>
            </div>
            <button 
                onClick={onClose} 
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all"
                aria-label="Close modal"
            >
                <i className="ri-close-line text-lg"></i>
            </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-grow flex flex-col min-h-0">
          <div className="p-3 sm:p-4 flex-grow overflow-y-auto lg:overflow-visible">
            <div className="lead-compact-card">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-3 gap-y-2.5">
                <div>
                  <label className="field-label">Name <span className="text-primary">*</span></label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="input-field" required />
                </div>
                <div>
                  <label className="field-label">Phone Number 1 <span className="text-primary">*</span></label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-field" required />
                </div>
                <div>
                  <label className="field-label">Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" />
                </div>
                <div>
                    <label className="field-label">Service</label>
                    <input type="text" name="service" value={formData.service || ''} onChange={handleChange} className="input-field" placeholder="e.g. Visa filing, Hotel booking" />
                  </div>
                  <div>
                    <label className="field-label">Lead Type</label>
                    <select name="leadType" value={formData.leadType || ''} onChange={handleChange} className="input-field">
                      <option value="">-- Select Lead Type --</option>
                      {formData.leadType && !serviceTypes.some(type => type.name === formData.leadType) && (
                        <option value={formData.leadType}>{formData.leadType}</option>
                      )}
                      {serviceTypes.map(type => <option key={type.id} value={type.name}>{type.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Lead Category</label>
                    <select name="leadCategory" value={formData.leadCategory || ''} onChange={handleChange} className="input-field">
                      <option value="">-- Select Lead Category --</option>
                      {formData.leadCategory && !leadCategories.some(category => category.name === formData.leadCategory) && (
                        <option value={formData.leadCategory}>{formData.leadCategory}</option>
                      )}
                      {leadCategories.map(category => <option key={category.id} value={category.name}>{category.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Country</label>
                    <select name="country" value={formData.country} onChange={handleChange} className="input-field">
                      {allCountries.map(c => <option key={c.isoCode} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Location</label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange} className="input-field" />
                  </div>
                  <div>
                    <label className="field-label">Company Name</label>
                    <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="input-field" />
                  </div>
                  <div>
                    <label className="field-label">Lead Source</label>
                    <select name="leadSource" value={formData.leadSource} onChange={handleChange} className="input-field">
                      {leadSources.map(source => <option key={source.id} value={source.name}>{source.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Lead Status <span className="text-primary">*</span></label>
                    <div
                      className="status-select-shell"
                      style={{
                        borderColor: selectedStatusVisual.borderColor,
                        backgroundColor: selectedStatusVisual.backgroundColor
                      }}
                    >
                      <span
                        className="status-select-dot"
                        style={{ backgroundColor: selectedStatusVisual.color, boxShadow: `0 0 0 3px ${selectedStatusVisual.strongBackgroundColor}` }}
                      ></span>
                      <select
                        name="leadStatus"
                        value={formData.leadStatus}
                        onChange={handleChange}
                        className="status-select-control"
                        required
                        style={{
                          color: selectedStatusVisual.color
                        }}
                      >
                        {leadStatuses.map(status => <option key={status.id} value={status.name}>{status.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="field-label">Assign To Agent</label>
                    <select 
                        name="assignedToId" 
                        value={formData.assignedToId} 
                        onChange={handleChange} 
                        className="input-field"
                        disabled={currentUser?.role !== 'Super Admin'}
                    >
                        <option value="">-- Unassigned --</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                        ))}
                    </select>
                    {currentUser?.role !== 'Super Admin' && (
                        <p className="mt-1 text-[11px] text-slate-500">Assigning restricted to Super Admins.</p>
                    )}
                  </div>
                  <div>
                    <label className="field-label">Lead Date</label>
                    <input 
                        type="date" 
                        name="createdAt" 
                        value={formData.createdAt} 
                        onChange={handleChange} 
                        className="input-field"
                    />
                  </div>
                  <div className="xl:col-span-4">
                    <button 
                        type="button" 
                        onClick={() => setShowAdditionalPhones(!showAdditionalPhones)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-primary hover:bg-primary/10 transition-colors"
                    >
                        <i className={showAdditionalPhones ? "ri-subtract-line" : "ri-add-line"}></i>
                        {showAdditionalPhones ? "Hide Additional Numbers" : "Add More Numbers"}
                    </button>
                  </div>

                  {showAdditionalPhones && (
                    <>
                      <div>
                          <label className="field-label">Phone Number 2</label>
                          <input type="tel" name="phone2" value={formData.phone2} onChange={handleChange} className="input-field" />
                      </div>
                      <div>
                          <label className="field-label">Phone Number 3</label>
                          <input type="tel" name="phone3" value={formData.phone3} onChange={handleChange} className="input-field" />
                      </div>
                      <div>
                          <label className="field-label">Phone Number 4</label>
                          <input type="tel" name="phone4" value={formData.phone4} onChange={handleChange} className="input-field" />
                      </div>
                    </>
                  )}

                  <div className="xl:col-span-4">
                    <label className="field-label">Remarks</label>
                    <textarea
                      name="remarks"
                      value={formData.remarks || ''}
                      onChange={handleChange}
                      rows={2}
                      className="input-field resize-none"
                      placeholder="Add lead remarks..."
                    />
                  </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 bg-white/95 px-4 py-3 border-t border-slate-200 flex-shrink-0">
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
        .lead-compact-card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 0.9rem;
            padding: 0.85rem;
            box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
        }
        .field-label {
            display: block;
            margin-bottom: 0.2rem;
            font-size: 0.66rem;
            line-height: 0.9rem;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #475569;
        }
        .input-field {
            display: block;
            width: 100%;
            border-radius: 0.75rem;
            border: 1px solid #CBD5E1;
            box-shadow: 0 1px 2px 0 rgb(15 23 42 / 0.04);
            font-size: 0.875rem;
            line-height: 1.25rem;
            padding: 0.48rem 0.7rem;
            background-color: #fff;
            transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
        }
        .input-field:disabled {
            background-color: #f1f5f9;
            color: #64748b;
            cursor: not-allowed;
        }
        .input-field:focus {
            outline: 2px solid transparent;
            outline-offset: 2px;
            border-color: #c4161c;
            box-shadow: 0 0 0 4px rgba(196, 22, 28, 0.12);
            z-index: 10;
            position: relative;
        }
        .status-select-shell {
            display: flex;
            align-items: center;
            width: 100%;
            min-width: 0;
            border-radius: 0.75rem;
            border: 1px solid #CBD5E1;
            padding-left: 0.7rem;
            background-color: #fff;
            box-shadow: 0 1px 2px 0 rgb(15 23 42 / 0.04);
            transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
        }
        .status-select-shell:focus-within {
            border-color: #c4161c;
            box-shadow: 0 0 0 4px rgba(196, 22, 28, 0.12);
        }
        .status-select-dot {
            width: 0.5rem;
            height: 0.5rem;
            border-radius: 9999px;
            flex: 0 0 auto;
            margin-right: 0.55rem;
        }
        .status-select-control {
            min-width: 0;
            width: 100%;
            border: 0;
            outline: none;
            background: transparent;
            font-size: 0.875rem;
            line-height: 1.25rem;
            font-weight: 800;
            padding: 0.48rem 0.6rem 0.48rem 0;
        }
        .status-select-control:focus {
            outline: none;
            box-shadow: none;
        }
      `}</style>
    </div>
  );
};

export default LeadModal;
