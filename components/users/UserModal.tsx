
import React, { useState, useEffect, useRef } from 'react';
import { User, Role } from '../../types';
import { useCrm } from '../../hooks/useCrm';
import { generateAvatar } from '../../utils/avatar';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Omit<User, 'id'> | User) => void;
  user: User | null;
}

const initialFormData: Omit<User, 'id'> = {
  name: '',
  username: '',
  email: '',
  roleId: '',
  role: '',
  status: 'Active',
  imageUrl: '',
};

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, user }) => {
  const [formData, setFormData] = useState(initialFormData);
  const { roles } = useCrm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');


  useEffect(() => {
    if (user) {
      setFormData({
          ...user,
          roleId: user.roleId || '',
          role: user.role || ''
      });
    } else {
      setFormData({
        ...initialFormData,
        roleId: roles[0]?.id || '',
        role: roles[0]?.name || ''
      });
    }
    // Reset password fields on open
    setPassword('');
    setConfirmPassword('');
    setPasswordError('');
  }, [user, isOpen, roles]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRoleId = e.target.value;
    const selectedRole = roles.find(r => String(r.id) === String(selectedRoleId));
    setFormData(prev => ({ 
        ...prev, 
        roleId: selectedRoleId, 
        role: selectedRole?.name || '' 
    }));
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!user && !password) {
        setPasswordError('Password is required for new users.');
        return;
    }

    if (password && password !== confirmPassword) {
        setPasswordError('Passwords do not match.');
        return;
    }
    
    // Create a mutable copy to potentially add password
    const userToSave: any = { ...formData };
    
    if (password) {
        userToSave.password = password;
    }

    onSave(userToSave);
  };
  
  const avatarSrc = formData.imageUrl || generateAvatar(formData.name);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl relative flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
         <button 
            onClick={onClose} 
            className="absolute top-4 right-4 w-8 h-8 bg-gray-700 rounded-full text-white flex items-center justify-center hover:bg-gray-900 transition-transform duration-300 hover:rotate-90 z-10"
            aria-label="Close modal"
        >
            <i className="ri-close-line"></i>
        </button>
        <div className="p-6 border-b flex-shrink-0">
            <h3 className="text-xl font-semibold text-gray-800">{user ? 'Edit User' : 'Create User'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="md:col-span-2 flex flex-col items-center space-y-3 mb-2">
                    <div className="relative group">
                        <img src={avatarSrc} alt={formData.name} className="w-24 h-24 rounded-full object-cover" />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center rounded-full transition-opacity duration-300 cursor-pointer"
                            aria-label="Change user image"
                        >
                            <i className="ri-camera-line text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></i>
                        </button>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Change
                        </button>
                        <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Remove
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                    </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name <span className="text-primary">*</span></label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username <span className="text-primary">*</span></label>
                  <input type="text" name="username" value={formData.username} onChange={handleChange} className="mt-1 input-field" required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Email Address <span className="text-primary">*</span></label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role <span className="text-primary">*</span></label>
                  <select name="roleId" value={formData.roleId} onChange={handleRoleChange} className="mt-1 input-field" required>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status <span className="text-primary">*</span></label>
                  <select name="status" value={formData.status} onChange={handleChange} className="mt-1 input-field" required>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{user ? 'New Password (optional)' : 'Password'}</label>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="mt-1 input-field" 
                    required={!user}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm {user ? 'New' : ''} Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    className="mt-1 input-field"
                    autoComplete="new-password"
                  />
                </div>
                {passwordError && <p className="md:col-span-2 text-sm text-red-600">{passwordError}</p>}
            </div>
          </div>
          <div className="flex justify-end space-x-3 bg-gray-50 p-4 rounded-b-lg flex-shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
              Save User
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

export default UserModal;
