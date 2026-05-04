
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useCrm } from '../hooks/useCrm';
import { useSwal } from '../hooks/useSwal';
import { ImportedFile, Target, User } from '../types';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/common/Pagination';
import { capitalizeName } from '../utils/formatters';
import { useSorting } from '../hooks/useSorting';
import SearchInput from '../components/common/SearchInput';
import PageContainer from '../components/layout/PageContainer';
import Tooltip from '../components/common/Tooltip';

const ImportDataContent: React.FC = () => {
    const { users, leadStatuses, leadSources, importLeads } = useCrm();
    const { fireToast } = useSwal();
    const [fileName, setFileName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [defaults, setDefaults] = useState({
        assignedToId: String(users[0]?.id || ''),
        leadStatus: leadStatuses[0]?.name || '',
        leadSource: String(leadSources[0]?.name || ''),
        note: ''
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setFileName(e.target.files[0].name);
        } else {
            setFile(null);
            setFileName('');
        }
    };

    const handleDefaultsChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDefaults(prev => ({ ...prev, [name]: value }));
    };

    const downloadTemplate = (e: React.MouseEvent) => {
        e.preventDefault();
        const headers = ['Name', 'Phone', 'Email', 'Service', 'Country'];
        const sampleRow = ['John Doe', '9876543210', 'john@example.com', 'Dubai Visa', 'India'];
        const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "leads_import_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        fireToast('success', 'Template downloaded successfully');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            fireToast('warning', 'Please select a CSV file to import.');
            return;
        }

        setIsSubmitting(true);
        try {
            await importLeads(file, defaults);
            fireToast('success', 'Data import started. Check history for results.');
            setFile(null);
            setFileName('');
        } catch (err) {
            fireToast('error', 'Import failed.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="animate-fade-in">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Bulk Import Leads</h3>
                    <p className="text-sm text-gray-500">Upload a CSV file to populate your pipeline instantly.</p>
                </div>
                <button 
                    onClick={downloadTemplate}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 bg-transparent border-none cursor-pointer"
                >
                    <i className="ri-download-line"></i> DOWNLOAD TEMPLATE
                </button>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Upload File (.csv)</label>
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="relative group cursor-pointer border-2 border-dashed border-gray-200 bg-white rounded-xl p-8 text-center hover:border-primary hover:bg-primary/5 transition-all"
                            >
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
                                <div className="flex flex-col items-center">
                                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <i className="ri-upload-cloud-2-line text-2xl"></i>
                                    </div>
                                    <p className="text-sm font-bold text-gray-700">{fileName || 'Click to select or drag and drop CSV file'}</p>
                                    <p className="text-xs text-gray-400 mt-1">Columns: Name, Phone, Email, Service, Country</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Assign To Agent</label>
                            <select name="assignedToId" value={defaults.assignedToId} onChange={handleDefaultsChange} className="input-field" required>
                                <option value="">Select User</option>
                                {users.map(user => <option key={user.id} value={String(user.id)}>{capitalizeName(user.name)}</option>)}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Default Pipeline Status</label>
                            <select name="leadStatus" value={defaults.leadStatus} onChange={handleDefaultsChange} className="input-field" required>
                                {leadStatuses.map(status => <option key={status.id} value={status.name}>{status.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Lead Source</label>
                            <select name="leadSource" value={defaults.leadSource} onChange={handleDefaultsChange} className="input-field" required>
                                {leadSources.map(source => <option key={source.id} value={source.name}>{source.name}</option>)}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Automated Welcome Note</label>
                            <textarea name="note" value={defaults.note} onChange={handleDefaultsChange} rows={2} className="input-field" placeholder="Add a remark for all these leads..."></textarea>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button 
                        type="submit" 
                        disabled={isSubmitting || !file}
                        className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-check-line"></i>}
                        START IMPORT PROCESS
                    </button>
                </div>
            </form>
        </div>
    );
};

const ExportDataContent: React.FC = () => {
    const { leads, customers, invoices, logExport } = useCrm();
    const { fireToast } = useSwal();

    const handleExport = async (module: 'Leads' | 'Customers' | 'Invoices', data: any[]) => {
        if (data.length === 0) {
            fireToast('warning', `No ${module} records to export.`);
            return;
        }

        fireToast('info', `Preparing ${module} export...`);
        
        // Generate CSV string
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(obj => {
            return Object.values(obj).map(val => {
                const stringVal = String(val);
                if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
                    return `"${stringVal.replace(/"/g, '""')}"`;
                }
                return stringVal;
            }).join(',');
        });

        const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent([headers, ...rows].join("\n"));
        const link = document.createElement("a");
        link.setAttribute("href", csvContent);
        link.setAttribute("download", `${module.toLowerCase()}_backup_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Audit the export in the backend
        await logExport(module, data.length);
        fireToast('success', `${module} backup complete.`);
    };

    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-800">Backup & Export</h3>
                <p className="text-sm text-gray-500">Download complete snapshots of your business modules.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                    { name: 'Leads', icon: 'ri-group-line', color: 'blue', data: leads },
                    { name: 'Customers', icon: 'ri-team-line', color: 'green', data: customers },
                ].map(mod => (
                    <div key={mod.name} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
                        <div className={`w-16 h-16 bg-${mod.color}-50 text-${mod.color}-600 rounded-2xl flex items-center justify-center text-3xl mb-4`}>
                            <i className={mod.icon}></i>
                        </div>
                        <h4 className="font-bold text-gray-800 text-lg">{mod.name}</h4>
                        <p className="text-xs text-gray-400 mt-1 mb-6 font-medium uppercase tracking-widest">{mod.data.length} Total Records</p>
                        <button 
                            onClick={() => handleExport(mod.name as any, mod.data)}
                            className={`w-full py-2.5 rounded-xl border border-${mod.color}-200 text-${mod.color}-600 font-bold text-sm hover:bg-${mod.color}-600 hover:text-white transition-all active:scale-95`}
                        >
                            Generate CSV
                        </button>
                    </div>
                ))}
            </div>

        </div>
    );
};

const SetTargetsContent: React.FC = () => {
    const { users, targets, addTarget, deleteTarget } = useCrm();
    const { fireToast, confirmDelete } = useSwal();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        userId: '',
        targetAmount: 0,
        module: 'Lead' as 'Lead' | 'Sales'
    });

    useEffect(() => {
        if (users.length > 0 && !formData.userId) {
            setFormData(prev => ({ ...prev, userId: String(users[0].id) }));
        }
    }, [users, formData.userId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.userId) return;

        setIsSaving(true);
        try {
            await addTarget({
                userId: formData.userId,
                targetAmount: formData.targetAmount,
                module: formData.module
            });
            fireToast('success', 'Target goal assigned');
            setFormData(prev => ({ ...prev, targetAmount: 0 }));
        } catch (err) {
            fireToast('error', 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (target: Target) => {
        const result = await confirmDelete({
            title: 'Remove Goal?',
            html: `Permanently delete tracking for <strong>${target.userName}</strong>?`
        });
        if (result) {
            await deleteTarget(String(target.id));
            fireToast('success', 'Goal removed');
        }
    };

    return (
        <div className="space-y-10 animate-fade-in">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Define Performance Goals</h3>
                    <p className="text-sm text-gray-500">Assign quotas and targets to individual agents for tracking.</p>
                </div>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Select Agent</label>
                        <select value={formData.userId} onChange={e => setFormData({...formData, userId: e.target.value})} className="input-field" required>
                            <option value="" disabled>Select Agent</option>
                            {users.map(u => <option key={u.id} value={String(u.id)}>{capitalizeName(u.name)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Metric Type</label>
                        <select value={formData.module} onChange={e => setFormData({...formData, module: e.target.value as any})} className="input-field">
                            <option value="Lead">Total New Leads</option>
                            <option value="Sales">Revenue Amount (₹)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Numerical Goal</label>
                        <input 
                            type="number" 
                            value={formData.targetAmount || ''} 
                            onChange={e => setFormData({...formData, targetAmount: Number(e.target.value)})} 
                            className="input-field" 
                            required 
                            placeholder="e.g. 50"
                        />
                    </div>
                    <button type="submit" disabled={isSaving} className="bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/10 active:scale-95 flex items-center justify-center">
                        {isSaving ? <i className="ri-loader-4-line animate-spin mr-2"></i> : <i className="ri-add-line mr-2"></i>}
                        ASSIGN GOAL
                    </button>
                </form>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-2">Active Targets Matrix</h3>
                <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-sm bg-white">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-5 text-left font-bold text-gray-600 uppercase text-[10px]">Performance Holder</th>
                                <th className="p-5 text-left font-bold text-gray-600 uppercase text-[10px]">Module</th>
                                <th className="p-5 text-left font-bold text-gray-600 uppercase text-[10px]">Quota</th>
                                <th className="p-5 text-left font-bold text-gray-600 uppercase text-[10px]">Realized</th>
                                <th className="p-5 text-left font-bold text-gray-600 uppercase text-[10px] w-1/4">Progress</th>
                                <th className="p-5 text-center font-bold text-gray-600 uppercase text-[10px]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {targets.map(t => {
                                const isRevenue = t.module === 'Sales';
                                const progress = t.targetAmount > 0 ? Math.min(100, (t.achieveAmount / t.targetAmount) * 100) : 0;
                                return (
                                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-5 font-bold text-gray-800 text-base">{capitalizeName(t.userName || 'Unknown')}</td>
                                        <td className="p-5">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${t.module === 'Lead' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                                                {t.module}
                                            </span>
                                        </td>
                                        <td className="p-5 font-bold text-gray-600">
                                            {isRevenue ? `₹${Number(t.targetAmount).toLocaleString()}` : t.targetAmount}
                                        </td>
                                        <td className="p-5 font-bold text-green-600">
                                            {isRevenue ? `₹${Number(t.achieveAmount).toLocaleString()}` : t.achieveAmount}
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-grow bg-gray-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-1000 ${progress >= 100 ? 'bg-green-500' : progress > 50 ? 'bg-amber-500' : 'bg-primary'}`} 
                                                        style={{width: `${progress}%`}}
                                                    ></div>
                                                </div>
                                                <span className="text-[11px] font-black text-gray-500 min-w-[35px]">{Math.round(progress)}%</span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-center">
                                            <button 
                                                onClick={() => handleDelete(t)}
                                                className="w-9 h-9 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <i className="ri-delete-bin-7-line text-lg"></i>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {targets.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-20 text-gray-400 italic bg-white">
                                        <i className="ri-donut-chart-line text-5xl mb-4 block opacity-30"></i>
                                        No performance targets are currently active.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const DataAdministrationPage: React.FC<{ activeView: 'import' | 'export' | 'target' }> = ({ activeView }) => {
    return (
        <PageContainer>
            <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl border p-8">
                {activeView === 'import' && <ImportDataContent />}
                {activeView === 'export' && <ExportDataContent />}
                {activeView === 'target' && <SetTargetsContent />}
            </div>
            <style>{`
                .input-field { 
                    display: block; 
                    width: 100%; 
                    border-radius: 0.75rem; 
                    border: 1px solid #E5E7EB; 
                    padding: 0.75rem 1rem; 
                    font-size: 0.875rem; 
                    transition: border-color 0.2s, box-shadow 0.2s;
                    background-color: #fff;
                }
                .input-field:focus { 
                    border-color: #c4161c; 
                    outline: none; 
                    box-shadow: 0 0 0 3px rgba(196, 22, 28, 0.1); 
                }
                .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </PageContainer>
    );
};

export default DataAdministrationPage;
