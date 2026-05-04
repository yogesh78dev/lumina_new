
import React, { useState, useEffect } from 'react';
import { Customer } from '../../types';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Omit<Customer, 'id' | 'createdAt' | 'customerId'> | Customer) => void;
  customer: Customer | null;
}

const initialFormData: Omit<Customer, 'id' | 'createdAt' | 'customerId'> = {
  name: '',
  email: '',
  phone: '',
  vendorId: '',
  saleById: '',
  serviceType: '',
  closeDate: '',
  action: '',
  passportStatus: 'With Client',
};

const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, onSave, customer }) => {
  const [formData, setFormData] = useState<Omit<Customer, 'id' | 'createdAt' | 'customerId'> | Customer>(initialFormData);

  useEffect(() => {
    if (customer) {
      setFormData(customer);
    } else {
      setFormData(initialFormData);
    }
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative" onClick={e => e.stopPropagation()}>
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 w-8 h-8 bg-gray-700 rounded-full text-white flex items-center justify-center hover:bg-gray-900 transition-colors"
            aria-label="Close modal"
        >
            <i className="ri-close-line"></i>
        </button>
        <div className="p-6 border-b">
            <h3 className="text-xl font-semibold text-gray-800">{customer ? 'Edit Customer' : 'Create Customer'}</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name <span className="text-primary">*</span></label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address <span className="text-primary">*</span></label>
              <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="mt-1 input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number <span className="text-primary">*</span></label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 input-field" required />
            </div>
          </div>
          <div className="flex justify-end space-x-3 bg-gray-50 p-4 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
              Save Customer
            </button>
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
        }
      `}</style>
    </div>
  );
};

export default CustomerModal;
