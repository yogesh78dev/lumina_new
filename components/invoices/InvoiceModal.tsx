
import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceStatus } from '../../types';
import { useCrm } from '../../hooks/useCrm';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Omit<Invoice, 'id'|'issuedDate'|'customerName'> | Invoice) => void;
  invoice: Invoice | null;
}

const initialFormData: Omit<Invoice, 'id'|'issuedDate'|'customerName'> = {
  customerId: '',
  amount: 0,
  dueDate: '',
  status: InvoiceStatus.DRAFT,
};

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, onSave, invoice }) => {
  const [formData, setFormData] = useState(initialFormData);
  const { customers } = useCrm();

  useEffect(() => {
    if (invoice) {
      setFormData({
        ...invoice,
        // Defensive check: split only if dueDate exists to prevent "cannot read properties of undefined"
        dueDate: invoice.dueDate ? String(invoice.dueDate).split('T')[0] : ''
      });
    } else {
       setFormData({
        ...initialFormData,
        customerId: customers[0]?.id || ''
       });
    }
  }, [invoice, isOpen, customers]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) : value }));
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
            className="absolute top-4 right-4 w-8 h-8 bg-gray-700 rounded-full text-white flex items-center justify-center hover:bg-gray-900 transition-transform duration-300 hover:rotate-90"
            aria-label="Close modal"
        >
            <i className="ri-close-line"></i>
        </button>
        <div className="p-6 border-b">
            <h3 className="text-xl font-semibold text-gray-800">{invoice ? 'Edit Invoice' : 'Create Invoice'}</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer <span className="text-primary">*</span></label>
              <select name="customerId" value={formData.customerId} onChange={handleChange} className="mt-1 input-field" required>
                <option value="" disabled>Select a customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Amount <span className="text-primary">*</span></label>
              <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₹</span>
                  </div>
                  <input 
                    type="number" 
                    name="amount" 
                    value={formData.amount} 
                    onChange={handleChange} 
                    className="input-field pl-7" 
                    required 
                    placeholder="0.00"
                  />
              </div>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Due Date <span className="text-primary">*</span></label>
              <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="mt-1 input-field" required />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Status <span className="text-primary">*</span></label>
              <select name="status" value={formData.status} onChange={handleChange} className="mt-1 input-field" required>
                {Object.values(InvoiceStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 bg-gray-50 p-4 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
              Save Invoice
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
        .input-field.pl-7 {
            padding-left: 1.75rem;
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

export default InvoiceModal;
