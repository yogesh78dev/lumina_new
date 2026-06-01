import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { Lead } from '../../types';
import { useCrm } from '../../hooks/useCrm';

interface ProformaInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
}

const ProformaInvoiceModal: React.FC<ProformaInvoiceModalProps> = ({ isOpen, onClose, lead }) => {
  const { companyDetails } = useCrm();
  const [amount, setAmount] = useState('');
  const [serviceName, setServiceName] = useState(lead.service || '');
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

  const proformaNumber = useMemo(() => {
    const idPart = String(lead.id).replace(/\D/g, '').slice(-6) || String(lead.id);
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `PFI-${stamp}-${idPart}`;
  }, [lead.id]);

  const qrPayload = useMemo(() => {
    const numericAmount = Number(amount || 0);
    return JSON.stringify({
      type: 'PROFORMA_INVOICE',
      proformaNumber,
      leadId: lead.id,
      leadName: lead.name,
      amount: Number.isFinite(numericAmount) ? numericAmount : 0,
      dueDate
    });
  }, [amount, dueDate, lead.id, lead.name, proformaNumber]);

  useEffect(() => {
    let cancelled = false;
    const generateQr = async () => {
      try {
        const url = await QRCode.toDataURL(qrPayload, {
          width: 220,
          margin: 1,
          errorCorrectionLevel: 'M'
        });
        if (!cancelled) setQrDataUrl(url);
      } catch (err) {
        if (!cancelled) setQrDataUrl('');
      }
    };
    generateQr();
    return () => { cancelled = true; };
  }, [qrPayload]);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 z-[11000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[92vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Generate Proforma Invoice</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-gray-100 text-gray-500">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-5">
          <div className="lg:col-span-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount (INR) <span className="text-primary">*</span></label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 input-field"
                placeholder="Enter amount"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Service</label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="mt-1 input-field"
                placeholder="Service description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Remarks</label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="mt-1 input-field resize-y"
                placeholder="Payment terms, notes, etc."
              />
            </div>
            <button
              onClick={handlePrint}
              disabled={!amount || Number(amount) <= 0}
              className="w-full py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="ri-printer-line mr-2"></i>
              Print Proforma
            </button>
          </div>

          <div className="lg:col-span-2 border rounded-lg p-5 bg-white proforma-print-area">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{companyDetails.companyName || 'Company'}</h2>
                <p className="text-xs text-gray-500 mt-1">{companyDetails.address || ''}</p>
                <p className="text-xs text-gray-500">{companyDetails.city || ''} {companyDetails.pincode || ''}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-gray-500">Proforma Invoice</p>
                <p className="font-semibold text-gray-800">{proformaNumber}</p>
                <p className="text-xs text-gray-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs uppercase">Bill To</p>
                <p className="font-semibold text-gray-800">{lead.name}</p>
                <p className="text-gray-600">{lead.phone}</p>
                <p className="text-gray-600">{lead.email || '-'}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-xs uppercase">Due Date</p>
                <p className="font-semibold text-gray-800">{dueDate || '-'}</p>
              </div>
            </div>

            <div className="mt-6 border rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 bg-gray-50 text-xs font-semibold text-gray-700 border-b">
                <div className="col-span-7 p-3">Description</div>
                <div className="col-span-2 p-3 text-right">Qty</div>
                <div className="col-span-3 p-3 text-right">Amount</div>
              </div>
              <div className="grid grid-cols-12 text-sm">
                <div className="col-span-7 p-3">{serviceName || lead.service || 'Lead Service'}</div>
                <div className="col-span-2 p-3 text-right">1</div>
                <div className="col-span-3 p-3 text-right">₹{Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Scan To Pay</p>
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Proforma QR" className="w-36 h-36 border rounded-md bg-white" />
                ) : (
                  <div className="w-36 h-36 border rounded-md bg-gray-50 flex items-center justify-center text-gray-400 text-xs">
                    Generating QR...
                  </div>
                )}
                <p className="text-[10px] text-gray-500 mt-1">Contains proforma reference + amount</p>
              </div>
              <div className="text-right ml-auto">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-black text-gray-900">₹{Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            {remarks && (
              <div className="mt-5 border-t pt-3">
                <p className="text-xs uppercase text-gray-500">Remarks</p>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{remarks}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .input-field {
          display: block;
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #d1d5db;
          padding: 0.6rem 0.75rem;
          font-size: 0.875rem;
        }
        .input-field:focus {
          outline: none;
          border-color: #c4161c;
          box-shadow: 0 0 0 2px #c4161c20;
        }
        @media print {
          body * { visibility: hidden; }
          .proforma-print-area, .proforma-print-area * { visibility: visible; }
          .proforma-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ProformaInvoiceModal;
