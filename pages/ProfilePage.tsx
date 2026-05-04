
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrm } from '../hooks/useCrm';
import { useSwal } from '../hooks/useSwal';
import { generateAvatar } from '../utils/avatar';
import { User } from '../types';
import { capitalizeName } from '../utils/formatters';
import PageContainer from '../components/layout/PageContainer';

type TabView = 'personal' | 'security' | 'activity';

const ProfilePage: React.FC = () => {
  const { currentUser, updateProfile, leads, userActivityLogs, fetchUserActivityLogs } = useCrm();
  const { fireToast } = useSwal();
  const navigate = useNavigate();
  
  if (!currentUser) return null;

  const [activeTab, setActiveTab] = useState<TabView>('personal');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFetchingLogs, setIsFetchingLogs] = useState(false);

  // Profile Form State
  const [name, setName] = useState(capitalizeName(currentUser.name));
  const [email, setEmail] = useState(currentUser.email);
  const [imagePreview, setImagePreview] = useState<string | null>(currentUser.imageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security Form State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Sync state with currentUser when it changes globally (e.g. from updateProfile)
  useEffect(() => {
    setName(capitalizeName(currentUser.name));
    setEmail(currentUser.email);
    setImagePreview(currentUser.imageUrl || null);
  }, [currentUser]);

  // Fetch activity logs on mount and specifically when activity tab is opened
  useEffect(() => {
    if (currentUser.id) {
        setIsFetchingLogs(true);
        fetchUserActivityLogs(String(currentUser.id)).finally(() => setIsFetchingLogs(false));
    }
  }, [currentUser.id, fetchUserActivityLogs]);

  // Stats Calculation
  const stats = useMemo(() => {
      const myLeads = leads.filter(l => String(l.assignedToId) === String(currentUser.id));
      const total = myLeads.length;
      const won = myLeads.filter(l => l.leadStatus === 'Won').length;
      const conversion = total > 0 ? Math.round((won / total) * 100) : 0;
      return { total, won, conversion };
  }, [leads, currentUser.id]);

  // Activity Logs
  const activityLogs = useMemo(() => {
      return userActivityLogs
        .filter(log => String(log.userId) === String(currentUser.id))
        .sort((a, b) => new Date(b.loginDate).getTime() - new Date(a.loginDate).getTime());
  }, [userActivityLogs, currentUser.id]);

  // Handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === '') return;

    const updatedData: Partial<User> = {};
    if (name !== currentUser.name) updatedData.name = name;
    if (email !== currentUser.email) updatedData.email = email;
    if (imagePreview !== currentUser.imageUrl) updatedData.imageUrl = imagePreview || undefined;

    if (Object.keys(updatedData).length > 0) {
      setIsUpdating(true);
      try {
          await updateProfile(String(currentUser.id), updatedData);
          fireToast('success', 'Profile updated successfully');
      } catch (err: any) {
          fireToast('error', err.message || 'Failed to update profile');
      } finally {
          setIsUpdating(false);
      }
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (!password) { setPasswordError('Please enter a new password.'); return; }
    if (password !== confirmPassword) { setPasswordError('Passwords do not match.'); return; }

    setIsUpdating(true);
    try {
        await updateProfile(String(currentUser.id), { password });
        fireToast('success', 'Password changed successfully');
        setPassword('');
        setConfirmPassword('');
    } catch (err: any) {
        fireToast('error', err.message || 'Failed to update password');
    } finally {
        setIsUpdating(false);
    }
  };

  const avatarSrc = imagePreview || generateAvatar(name);

  const tabClass = (tabName: TabView) => 
    `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
        activeTab === tabName
        ? 'border-primary text-primary'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDEBAR: Profile Card Only */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-8 text-center border-b border-gray-100">
                    <div className="relative inline-block mb-4">
                        <img 
                            src={avatarSrc} 
                            alt="Profile" 
                            className="w-32 h-32 rounded-full object-cover border-4 border-gray-50 shadow-sm" 
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-1 right-1 bg-white text-gray-600 p-2 rounded-full shadow border border-gray-200 hover:text-primary transition-colors"
                            title="Change Photo"
                        >
                            <i className="ri-camera-fill text-lg"></i>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">{capitalizeName(currentUser.name)}</h2>
                    
                    {/* Role Badge */}
                    <div className="mb-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                            currentUser.role === 'Super Admin' 
                            ? 'bg-primary/10 text-primary border-primary/20' 
                            : 'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                            {currentUser.role}
                        </span>
                    </div>
                    
                    <div className="flex justify-center gap-3">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full border border-gray-200">
                            @{currentUser.username}
                        </span>
                        <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Active
                        </span>
                    </div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 divide-x divide-gray-100 bg-gray-50/50">
                    <div className="p-4 text-center">
                        <p className="text-xl font-bold text-gray-800">{stats.total}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Leads</p>
                    </div>
                    <div className="p-4 text-center">
                        <p className="text-xl font-bold text-green-600">{stats.won}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Won</p>
                    </div>
                    <div className="p-4 text-center">
                        <p className="text-xl font-bold text-blue-600">{stats.conversion}%</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Conv.</p>
                    </div>
                </div>
            </div>
          </div>

          {/* RIGHT CONTENT AREA: Tabs & Forms */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-fit">
                
                {/* Top Tabs */}
                <div className="border-b border-gray-200 px-8">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button onClick={() => setActiveTab('personal')} className={tabClass('personal')}>
                            <i className="ri-user-line mr-2"></i>Personal Information
                        </button>
                        <button onClick={() => setActiveTab('security')} className={tabClass('security')}>
                            <i className="ri-shield-key-line mr-2"></i>Login & Security
                        </button>
                        <button onClick={() => setActiveTab('activity')} className={tabClass('activity')}>
                            <i className="ri-history-line mr-2"></i>Login Activity
                        </button>
                    </nav>
                </div>

                {/* Content Area */}
                <div className="p-8 flex-grow min-h-[400px]">
                    
                    {/* 1. PERSONAL INFORMATION */}
                    {activeTab === 'personal' && (
                        <div className="animate-fade-in-up max-w-2xl">
                            <div className="mb-6 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Basic Information</h3>
                                    <p className="text-sm text-gray-500">Update your personal details here.</p>
                                </div>
                            </div>
                            
                            <form onSubmit={handleProfileUpdate} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="input-field"
                                            placeholder="Your full name"
                                            required
                                        />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                        <input
                                            type="text"
                                            value={currentUser.username}
                                            disabled
                                            className="input-field bg-gray-50 text-gray-500 cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="input-field"
                                            placeholder="you@example.com"
                                            required
                                        />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                        <input
                                            type="text"
                                            value={currentUser.role}
                                            disabled
                                            className="input-field bg-gray-50 text-gray-500 cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button 
                                        type="submit" 
                                        disabled={isUpdating}
                                        className="btn-primary px-8 disabled:opacity-50"
                                    >
                                        {isUpdating ? <i className="ri-loader-4-line animate-spin mr-2"></i> : null}
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* 2. SECURITY */}
                    {activeTab === 'security' && (
                        <div className="animate-fade-in-up max-w-lg">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-800">Password & Security</h3>
                                <p className="text-sm text-gray-500">Ensure your account is secure with a strong password.</p>
                            </div>

                            <form onSubmit={handlePasswordUpdate} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="input-field pr-10"
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                            required
                                        />
                                        <i className="ri-lock-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="input-field pr-10"
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                            required
                                        />
                                        <i className="ri-lock-check-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                    </div>
                                </div>

                                {passwordError && (
                                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100 flex items-center animate-shake">
                                        <i className="ri-error-warning-line mr-2"></i> {passwordError}
                                    </div>
                                )}

                                <div className="pt-4">
                                    <button 
                                        type="submit" 
                                        disabled={isUpdating}
                                        className="btn-primary w-full disabled:opacity-50"
                                    >
                                        {isUpdating ? <i className="ri-loader-4-line animate-spin mr-2"></i> : null}
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* 3. ACTIVITY */}
                    {activeTab === 'activity' && (
                        <div className="animate-fade-in-up">
                            <div className="mb-6 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Recent Login Activity</h3>
                                    <p className="text-sm text-gray-500">Monitor your account access history.</p>
                                </div>
                                {isFetchingLogs && (
                                    <div className="flex items-center text-xs text-gray-400">
                                        <i className="ri-loader-4-line animate-spin mr-2"></i> Syncing...
                                    </div>
                                )}
                            </div>

                            <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">IP Address</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {activityLogs.length > 0 ? (
                                            activityLogs.map((log) => (
                                                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">
                                                                {new Date(log.loginDate).toLocaleDateString('en-US', { 
                                                                    month: 'short', 
                                                                    day: 'numeric', 
                                                                    year: 'numeric' 
                                                                })}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {new Date(log.loginDate).toLocaleTimeString('en-US', { 
                                                                    hour: '2-digit', 
                                                                    minute: '2-digit' 
                                                                })}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                                                        {log.ipAddress}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${log.status === 'Logged In' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {log.location || 'Web Application'}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-16 text-center text-gray-500">
                                                    {isFetchingLogs ? (
                                                        <div className="flex flex-col items-center">
                                                            <i className="ri-loader-4-line animate-spin text-3xl text-primary mb-2"></i>
                                                            <p>Loading activity logs...</p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <i className="ri-history-line text-4xl mb-2 text-gray-200 block"></i>
                                                            No activity logs found.
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .input-field {
            display: block;
            width: 100%;
            border-radius: 0.5rem;
            border: 1px solid #d1d5db;
            padding: 0.75rem 1rem;
            font-size: 0.875rem;
            line-height: 1.25rem;
            transition: all 0.2s;
            background-color: #fff;
        }
        .input-field:focus {
            outline: none;
            border-color: #c4161c;
            box-shadow: 0 0 0 3px rgba(196, 22, 28, 0.1);
        }
        .btn-primary {
            display: inline-flex;
            justify-content: center;
            align-items: center;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            font-weight: 600;
            color: white;
            background-color: #c4161c;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            transition: all 0.2s;
            cursor: pointer;
        }
        .btn-primary:hover {
            background-color: #a51217;
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .btn-primary:active {
            transform: translateY(0px);
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fadeInUp 0.3s ease-out forwards;
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        .animate-shake {
            animation: shake 0.4s ease-in-out 0s 1;
        }
      `}</style>
    </PageContainer>
  );
};

export default ProfilePage;
