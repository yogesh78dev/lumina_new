
import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { useCrm } from '../../hooks/useCrm';
import { allCountries } from '../../utils/countries';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Omit<Lead, 'id' | 'createdAt'> | Lead) => void;
  onSaveAndNew: (lead: Omit<Lead, 'id' | 'createdAt'>) => void;
  lead: Lead | null;
}

const initialFormData: Omit<Lead, 'id' | 'createdAt'> = {
  name: '',
  phone: '',
  email: '',
  service: '',
  country: '',
  leadSource: '',
  leadStatus: '',
  companyName: '',
  location: '',
  applicationStatus: '',
  passportStatus: 'With Client',
  documents: [],
};

const LeadModal: React.FC<LeadModalProps> = ({ isOpen, onClose, onSave, onSaveAndNew, lead }) => {
  const [formData, setFormData] = useState(initialFormData);
  const { leadSources, leadStatuses, applicationStatuses, passportStatuses } = useCrm();

  useEffect(() => {
    if (isOpen) {
        if (lead) {
            setFormData(lead);
        } else {
            setFormData({
                ...initialFormData,
                country: 'India',
                leadSource: leadSources[0]?.name || '',
                leadStatus: leadStatuses[0]?.name || '',
                applicationStatus: applicationStatuses[0]?.name || '',
                passportStatus: passportStatuses[0]?.name || 'With Client'
            });
        }
    }
  }, [lead, isOpen, leadSources, leadStatuses, applicationStatuses, passportStatuses]);

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
        applicationStatus: applicationStatuses[0]?.name || '',
        passportStatus: passportStatuses[0]?.name || 'With Client'
      });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  const handleSaveAndNewClick = () => {
    onSaveAndNew(formData);
    handleClear();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
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
              <label className="block text-sm font-medium text-gray-700">Phone Number <span className="text-primary">*</span></label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 input-field" required />
            </div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700">Lead Source</label>
              <select name="leadSource" value={formData.leadSource} onChange={handleChange} className="mt-1 input-field">
                {leadSources.map(source => <option key={source.id} value={source.name}>{source.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Pipeline Status <span className="text-primary">*</span></label>
              <select name="leadStatus" value={formData.leadStatus} onChange={handleChange} className="mt-1 input-field" required>
                {leadStatuses.map(status => <option key={status.id} value={status.name}>{status.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-1 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700">Application Status</label>
                <select name="applicationStatus" value={formData.applicationStatus} onChange={handleChange} className="mt-1 input-field">
                    {applicationStatuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
            </div>
            <div className="md:col-span-1 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700">Passport Status</label>
                <select name="passportStatus" value={formData.passportStatus} onChange={handleChange} className="mt-1 input-field">
                    {passportStatuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 bg-gray-50 p-4 rounded-b-lg flex-shrink-0">
            <button type="button" onClick={handleClear} className="px-5 py-2.5 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 text-sm">
              Clear
            </button>
            <button type="submit" className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 text-sm">
              Submit Details
            </button>
            {!lead && (
                 <button type="button" onClick={handleSaveAndNewClick} className="px-5 py-2.5 bg-secondary text-white font-semibold rounded-lg hover:bg-black text-sm">
                    Save & New
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
