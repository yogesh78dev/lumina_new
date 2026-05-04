
import React, { useState, useRef } from 'react';
import { useCrm } from '../../hooks/useCrm';
import { useSwal } from '../../hooks/useSwal';
import { capitalizeName } from '../../utils/formatters';

interface ImportLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportLeadsModal: React.FC<ImportLeadsModalProps> = ({ isOpen, onClose }) => {
  const { users, leadStatuses, leadSources, importLeads } = useCrm();
  const { fireToast } = useSwal();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [defaults, setDefaults] = useState({
    assignedToId: String(users[0]?.id || ''),
    leadStatus: leadStatuses[0]?.name || '',
    leadSource: leadSources[0]?.name || '',
    note: ''
  });

  const handleDefaultsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setDefaults(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile) {
        if (selectedFile.name.toLowerCase().endsWith('.csv')) {
            setFile(selectedFile);
        } else {
            fireToast('error', 'Only CSV files are supported.');
        }
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0] || null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files?.[0] || null);
  };

  const downloadTemplate = (e: React.MouseEvent) => {
    e.preventDefault();
    const headers = ['Name', 'Phone', 'Email', 'Service', 'Country'];
    const sampleRow = ['Jane Smith', '9123456780', 'jane.smith@example.com', 'UK Visitor Visa', 'India'];
    const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "leads_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    fireToast('success', 'Template downloaded');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      fireToast('error', 'Please select a file to import.');
      return;
    }

    setIsSubmitting(true);
    try {
        await importLeads(file, defaults);
        fireToast('success', 'Import processed successfully!');
        onClose();
    } catch (err: any) {
        fireToast('error', err.message || 'Import failed.');
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b bg-gray-50/50">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Bulk Import Leads</h3>
            <p className="text-xs text-gray-500 mt-0.5">Upload CSV to populate your pipeline</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-all">
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
          <div className="p-6 space-y-8">
            {/* Dropzone */}
            <div 
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 cursor-pointer ${
                  isDragging 
                  ? 'border-primary bg-primary/5 scale-[0.99]' 
                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100/50 hover:border-gray-300'
              }`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4 text-primary">
                  <i className="ri-upload-cloud-2-line text-3xl"></i>
              </div>
              <h4 className="text-base font-bold text-gray-700">
                  {file ? file.name : 'Click or drag CSV file here'}
              </h4>
              <p className="text-xs text-gray-500 mt-2">Required Columns: Name, Phone</p>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden"/>
              
              {file && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-1 bg-green-100 text-green-700 rounded-md border border-green-200">
                          FILE READY
                      </span>
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="text-[10px] font-bold text-red-500 hover:underline"
                      >
                          Remove
                      </button>
                  </div>
              )}
            </div>

            <div className="flex justify-center">
                <button 
                    type="button"
                    onClick={downloadTemplate}
                    className="text-xs font-bold text-primary hover:bg-primary/5 px-4 py-2 rounded-lg border border-primary/20 transition-all flex items-center gap-2"
                >
                    <i className="ri-download-2-line text-sm"></i>
                    DOWNLOAD CSV TEMPLATE
                </button>
            </div>

            {/* Default Settings */}
            <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100 space-y-6">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <i className="ri-settings-3-line"></i> Pipeline Defaults
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Assign To Agent</label>
                        <select name="assignedToId" value={defaults.assignedToId} onChange={handleDefaultsChange} className="input-field-custom">
                            <option value="">Unassigned</option>
                            {users.map(user => <option key={user.id} value={user.id}>{capitalizeName(user.name)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Lead Status</label>
                        <select name="leadStatus" value={defaults.leadStatus} onChange={handleDefaultsChange} className="input-field-custom">
                            {leadStatuses.map(status => <option key={status.id} value={status.name}>{status.name}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Lead Source</label>
                        <select name="leadSource" value={defaults.leadSource} onChange={handleDefaultsChange} className="input-field-custom">
                            {leadSources.map(source => <option key={source.id} value={source.name}>{source.name}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Default Remark</label>
                        <textarea 
                            name="note" 
                            value={defaults.note} 
                            onChange={handleDefaultsChange} 
                            rows={2} 
                            className="input-field-custom resize-none" 
                            placeholder="Add a common note for all imported leads..."
                        ></textarea>
                    </div>
                </div>
            </div>
          </div>

          <div className="flex justify-end items-center gap-3 bg-gray-50 p-6 border-t">
            <button 
                type="button" 
                onClick={onClose} 
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all text-sm shadow-sm"
            >
              Cancel
            </button>
            <button 
                type="submit" 
                disabled={!file || isSubmitting}
                className="px-8 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all text-sm shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-check-line"></i>}
              {isSubmitting ? 'Importing...' : 'Confirm Import'}
            </button>
          </div>
        </form>
      </div>
       <style>{`
        .input-field-custom {
            display: block;
            width: 100%;
            border-radius: 0.75rem;
            border: 1px solid #E5E7EB;
            box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
            font-size: 0.875rem;
            line-height: 1.25rem;
            padding: 0.75rem 1rem;
            background-color: #fff;
            transition: all 0.2s;
        }
        .input-field-custom:focus {
            outline: none;
            border-color: #c4161c;
            box-shadow: 0 0 0 4px rgba(196, 22, 28, 0.1);
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fadeInUp 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ImportLeadsModal;
