
import React, { useState, useEffect } from 'react';
import { Role, Permissions, ModuleName, PermissionAction } from '../../types';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (role: Omit<Role, 'id'> | Role) => void;
  role: Role | null;
}

const MODULES: {key: ModuleName, label: string}[] = [
    { key: 'leads', label: 'Leads Management' },
    { key: 'customers', label: 'Customer Relations' },
    { key: 'vendors', label: 'Vendor Directory' },
    { key: 'invoices', label: 'Billing & Invoices' },
    { key: 'reminders', label: 'Follow-ups & Tasks' },
    { key: 'workflows', label: 'Automations' },
    { key: 'users', label: 'User Directory' },
    { key: 'roles', label: 'Access Control' },
    { key: 'settings', label: 'General Settings' },
];

const ACTIONS: PermissionAction[] = ['read', 'create', 'update', 'delete'];

const initialFormData: Omit<Role, 'id'> = {
  name: '',
  permissions: {},
  status: 'Active'
};

const RoleModal: React.FC<RoleModalProps> = ({ isOpen, onClose, onSave, role }) => {
  const [formData, setFormData] = useState<Omit<Role, 'id'> | Role>(initialFormData);

  // Robust initialization when role changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (role) {
        // Senior Safety: Double check if permissions is a string and parse it if so
        let basePerms: any = role.permissions || {};
        if (typeof basePerms === 'string') {
            try {
                basePerms = JSON.parse(basePerms);
            } catch (e) {
                basePerms = {};
            }
        }
        
        const sanitizedPerms: Permissions = {};
        
        // Map existing permissions into our standardized structure
        MODULES.forEach(mod => {
            const existing = basePerms[mod.key];
            sanitizedPerms[mod.key] = Array.isArray(existing) ? [...existing] : [];
        });

        setFormData({ 
            ...role, 
            permissions: sanitizedPerms 
        });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [role, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (module: ModuleName, action: PermissionAction) => {
    setFormData(prev => {
        const perms = { ...prev.permissions };
        const currentModulePerms = perms[module] || [];
        
        const newModulePerms = currentModulePerms.includes(action)
            ? currentModulePerms.filter(p => p !== action)
            : [...currentModulePerms, action];
        
        return {
            ...prev,
            permissions: {
                ...prev.permissions,
                [module]: newModulePerms
            }
        };
    });
  };

  const toggleAllForModule = (module: ModuleName) => {
      setFormData(prev => {
          const current = prev.permissions[module] || [];
          const hasAll = current.length === ACTIONS.length;
          return {
              ...prev,
              permissions: {
                  ...prev.permissions,
                  [module]: hasAll ? [] : [...ACTIONS]
              }
          };
      });
  };

  const toggleGlobalAll = () => {
      setFormData(prev => {
          const totalPossible = MODULES.length * ACTIONS.length;
          let currentCount = 0;
          Object.values(prev.permissions).forEach(arr => currentCount += (arr?.length || 0));
          
          const shouldSelectAll = currentCount < totalPossible;
          const newPerms: Permissions = {};
          
          MODULES.forEach(m => {
              newPerms[m.key] = shouldSelectAll ? [...ACTIONS] : [];
          });
          
          return { ...prev, permissions: newPerms };
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
         <button 
            onClick={onClose} 
            className="absolute top-4 right-4 w-10 h-10 bg-gray-100 rounded-full text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-all hover:rotate-90 z-10"
        >
            <i className="ri-close-line text-2xl"></i>
        </button>

        <div className="p-6 border-b flex-shrink-0 bg-gray-50/50">
            <h3 className="text-xl font-bold text-gray-900">{role ? 'Configure Access Policy' : 'Create System Role'}</h3>
            <p className="text-sm text-gray-500 mt-1">Define granular module-level permissions for this user group.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
          <div className="flex-grow overflow-y-auto p-6 space-y-8 thin-scrollbar">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Role Name <span className="text-primary">*</span></label>
                    <input 
                        type="text" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        className="input-field-new" 
                        placeholder="e.g. Sales Director"
                        required 
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Role Status</label>
                    <select 
                        name="status" 
                        value={formData.status} 
                        onChange={handleChange} 
                        className="input-field-new"
                    >
                        <option value="Active">Active (Users can be assigned)</option>
                        <option value="Inactive">Inactive (Disabled)</option>
                    </select>
                </div>
            </div>
            
            <div>
              <div className="flex justify-between items-end mb-4 px-1">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Permission Matrix</label>
                    <p className="text-[10px] text-gray-400 mt-0.5">Toggle row to grant full module access or select individually.</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={toggleGlobalAll}
                    className="text-[10px] font-bold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 transition-all flex items-center gap-1.5"
                  >
                    <i className="ri-check-double-line text-xs"></i>
                    TOGGLE GLOBAL ACCESS
                  </button>
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="p-4 text-left font-bold text-gray-700">Module</th>
                      {ACTIONS.map(action => (
                        <th key={action} className="p-4 text-center font-bold text-gray-600 w-24 uppercase text-[10px] tracking-widest">{action}</th>
                      ))}
                      <th className="p-4 w-14">Row</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {MODULES.map(module => (
                      <tr key={module.key} className="hover:bg-blue-50/20 transition-colors">
                        <td className="p-4">
                            <span className="font-semibold text-gray-800">{module.label}</span>
                        </td>
                        {ACTIONS.map(action => {
                          const isChecked = formData.permissions[module.key]?.includes(action) || false;
                          return (
                            <td key={action} className="p-4 text-center">
                                <input
                                  type="checkbox"
                                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary transition-all cursor-pointer"
                                  checked={isChecked}
                                  onChange={() => handlePermissionChange(module.key, action)}
                                />
                            </td>
                          );
                        })}
                        <td className="p-4 text-center">
                            <button 
                                type="button" 
                                onClick={() => toggleAllForModule(module.key)}
                                className="text-gray-300 hover:text-primary transition-colors p-1"
                                title="Toggle All for Row"
                            >
                                <i className="ri-list-check-3 text-lg"></i>
                            </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end items-center gap-3 bg-gray-50 p-6 border-t flex-shrink-0">
            <button type="button" onClick={onClose} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all text-sm shadow-sm">
              Discard
            </button>
            <button type="submit" className="px-8 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all text-sm shadow-lg shadow-primary/20 active:scale-95">
              {role ? 'Save Policy Changes' : 'Initialize Role'}
            </button>
          </div>
        </form>
      </div>
       <style>{`
        .input-field-new {
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
        .input-field-new:focus {
            outline: none;
            border-color: #c4161c;
            box-shadow: 0 0 0 4px rgba(196, 22, 28, 0.1);
        }
        .thin-scrollbar::-webkit-scrollbar { width: 6px; }
        .thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .thin-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default RoleModal;
