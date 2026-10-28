import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import articleService from '../../services/articleService';
import {
  User,
  KeyRound,
  Shield,
  X,
  CheckCircle,
  AlertCircle,
  Save,
  Lock,
  Building,
  Mail,
  FileText,
  UserCheck,
  Users,
} from 'lucide-react';

const ROLE_LABELS = {
  super_admin: { label: 'Super Administrator', color: 'bg-red-900/10 text-red-800 border-red-300' },
  superadmin: { label: 'Super Administrator', color: 'bg-red-900/10 text-red-800 border-red-300' },
  admin: { label: 'Administrator', color: 'bg-blue-900/10 text-blue-800 border-blue-300' },
  editor: { label: 'Senior Broadsheet Editor', color: 'bg-mcc-gold/20 text-mcc-maroon border-mcc-gold' },
  reporter: { label: 'Staff Newsroom Reporter', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  faculty: { label: 'Academic Faculty Liaison', color: 'bg-blue-50 text-blue-800 border-blue-300' },
};

export default function UserProfileModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();

  const isSuper = user?.role === 'super_admin' || user?.role === 'superadmin';

  const [activeTab, setActiveTab] = useState('my_credentials'); // 'my_credentials' | 'admin_credentials' | 'profile'

  // Super Admin / Self credentials state
  const [name, setName] = useState('');
  const [myUsername, setMyUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selfSaving, setSelfSaving] = useState(false);
  const [selfError, setSelfError] = useState(null);
  const [selfSuccess, setSelfSuccess] = useState(null);

  // Admin credentials state (managed by Super Admin)
  const [adminList, setAdminList] = useState([]);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminError, setAdminError] = useState(null);
  const [adminSuccess, setAdminSuccess] = useState(null);

  // Initialize self form when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setMyUsername(user.username || user.email || 'root');
      setBio(user.bio || '');
      setAvatarUrl(user.avatar_url || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSelfError(null);
      setSelfSuccess(null);
      setAdminError(null);
      setAdminSuccess(null);
    }
  }, [isOpen, user]);

  // Load admin accounts list when Super Admin opens modal
  useEffect(() => {
    if (isOpen && isSuper) {
      async function loadAdminAccounts() {
        try {
          setAdminLoading(true);
          const res = await articleService.getUsers();
          if (res && res.data) {
            // Find admin/editor users (excluding current super admin)
            const admins = res.data.filter((u) => u.id !== user?.id);
            setAdminList(admins);

            // Default to first admin or editor
            const defaultAdmin = admins.find(
              (u) => u.role === 'admin' || u.role === 'editor' || u.role === 'super_admin'
            ) || admins[0];

            if (defaultAdmin) {
              setSelectedAdminId(String(defaultAdmin.id));
              setAdminUsername(defaultAdmin.username || defaultAdmin.email?.split('@')[0] || 'admin');
              setAdminName(defaultAdmin.name || '');
              setAdminEmail(defaultAdmin.email || '');
              setAdminPassword('');
              setAdminConfirmPassword('');
            }
          }
        } catch (err) {
          console.error('Failed to load admin accounts in modal:', err);
        } finally {
          setAdminLoading(false);
        }
      }
      loadAdminAccounts();
    }
  }, [isOpen, isSuper, user?.id]);

  if (!isOpen) return null;

  const currentRole = ROLE_LABELS[user?.role] || {
    label: user?.role || 'Staff Member',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  // Switch selected admin in admin credentials tab
  const handleSelectAdmin = (e) => {
    const targetId = e.target.value;
    setSelectedAdminId(targetId);
    setAdminError(null);
    setAdminSuccess(null);
    const target = adminList.find((u) => String(u.id) === String(targetId));
    if (target) {
      setAdminUsername(target.username || target.email?.split('@')[0] || 'admin');
      setAdminName(target.name || '');
      setAdminEmail(target.email || '');
      setAdminPassword('');
      setAdminConfirmPassword('');
    }
  };

  // Submit Super Admin self credentials & password update
  const handleSelfSubmit = async (e) => {
    e.preventDefault();
    setSelfError(null);
    setSelfSuccess(null);

    if (!myUsername.trim()) {
      setSelfError('Username cannot be empty.');
      return;
    }

    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        setSelfError('Current password is required to change your password.');
        return;
      }
      if (newPassword.length < 4) {
        setSelfError('New password must contain at least 4 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setSelfError('New password and confirmation do not match.');
        return;
      }
    }

    try {
      setSelfSaving(true);

      // 1. Update Profile (Name & Username)
      const res = await articleService.updateProfile({
        name: name.trim(),
        username: myUsername.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl.trim(),
      });

      // 2. If password provided, update password
      if (newPassword) {
        await articleService.changePassword({
          currentPassword,
          newPassword,
        });
      }

      if (res && res.data) {
        if (updateUser) {
          updateUser({ ...res.data, username: myUsername.trim() });
        }
      }

      setSelfSuccess(
        newPassword
          ? `Super Admin username (@${myUsername.trim()}) and password updated successfully!`
          : `Super Admin username updated to @${myUsername.trim()} successfully!`
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Failed to update credentials:', err);
      setSelfError(
        err.response?.data?.error || 'Failed to update credentials. Please check current password and try again.'
      );
    } finally {
      setSelfSaving(false);
    }
  };

  // Submit Admin credentials & password update (by Super Admin)
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setAdminError(null);
    setAdminSuccess(null);

    if (!selectedAdminId) {
      setAdminError('Please select an administrative account to modify.');
      return;
    }

    if (!adminUsername.trim()) {
      setAdminError('Admin username is required.');
      return;
    }

    if (adminPassword) {
      if (adminPassword.length < 4) {
        setAdminError('New password must contain at least 4 characters.');
        return;
      }
      if (adminPassword !== adminConfirmPassword) {
        setAdminError('New password and confirmation do not match.');
        return;
      }
    }

    try {
      setAdminSaving(true);

      const payload = {
        name: adminName.trim(),
        username: adminUsername.trim(),
        email: adminEmail.trim(),
      };
      if (adminPassword) {
        payload.password = adminPassword.trim();
      }

      const res = await articleService.updateUser(selectedAdminId, payload);

      setAdminSuccess(
        adminPassword
          ? `Admin credentials and password updated successfully for @${adminUsername.trim()}!`
          : `Admin account details updated successfully for @${adminUsername.trim()}!`
      );

      // Update local admin list
      if (res && res.data) {
        setAdminList((prev) =>
          prev.map((a) => (String(a.id) === String(selectedAdminId) ? { ...a, ...res.data } : a))
        );
      }
      setAdminPassword('');
      setAdminConfirmPassword('');
    } catch (err) {
      console.error('Failed to update admin credentials:', err);
      setAdminError(err.response?.data?.error || 'Failed to update admin credentials.');
    } finally {
      setAdminSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-[#fbfaf8] border-2 border-mcc-maroon max-w-xl w-full rounded-md shadow-2xl overflow-hidden font-serif flex flex-col my-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
        {/* ============================================================== */}
        {/* 1. MASTHEAD HEADER */}
        {/* ============================================================== */}
        <div className="p-5 bg-white border-b-2 border-mcc-maroon/20 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-mcc-maroon border border-mcc-gold text-mcc-gold flex items-center justify-center text-lg font-serif font-black shadow-xs shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user?.name || 'Staff avatar'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : user?.name ? (
                user.name[0].toUpperCase()
              ) : (
                'M'
              )}
            </div>
            <div>
              <span className="text-[10px] font-serif uppercase tracking-widest text-mcc-gold font-bold block">
                {isSuper ? 'Super Admin Master Governance' : 'Collegiate Staff Dossier'}
              </span>
              <h2 id="profile-modal-title" className="text-lg font-serif font-black text-gray-900 leading-tight">
                {user?.name || (isSuper ? 'Super Administrator' : 'Staff Member')}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-serif uppercase tracking-wider font-bold border ${currentRole.color}`}
                >
                  {currentRole.label}
                </span>
                <span className="text-[11px] text-mcc-navy font-mono font-bold">
                  User: @{user?.username || user?.email || 'root'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* 2. TAB SELECTOR */}
        {/* ============================================================== */}
        <div className="flex border-b border-gray-200 bg-gray-50/80 px-5 pt-2 gap-3 overflow-x-auto">
          {/* Tab 1: Self Credentials */}
          <button
            type="button"
            onClick={() => setActiveTab('my_credentials')}
            className={`pb-2.5 px-2 font-serif text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'my_credentials'
                ? 'border-mcc-maroon text-mcc-maroon'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-mcc-gold" />
            <span>Super Admin Password</span>
          </button>

          {/* Tab 2: Admin Credentials (for Super Admin) */}
          {isSuper && (
            <button
              type="button"
              onClick={() => setActiveTab('admin_credentials')}
              className={`pb-2.5 px-2 font-serif text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'admin_credentials'
                  ? 'border-mcc-maroon text-mcc-maroon'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-mcc-navy" />
              <span>Admin Password & Credentials</span>
            </button>
          )}

          {/* Tab 3: Bio & Dossier */}
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-2 font-serif text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-mcc-maroon text-mcc-maroon'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Dossier & Bio</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: SUPER ADMIN CREDENTIALS & PASSWORD */}
        {/* ============================================================== */}
        {activeTab === 'my_credentials' && (
          <form onSubmit={handleSelfSubmit} className="p-6 space-y-4">
            {selfSuccess && (
              <div className="p-3 rounded bg-emerald-50 border-l-4 border-emerald-700 text-emerald-900 text-xs font-serif flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{selfSuccess}</span>
              </div>
            )}

            {selfError && (
              <div className="p-3 rounded bg-red-50 border-l-4 border-red-700 text-red-900 text-xs font-serif flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                <span>{selfError}</span>
              </div>
            )}

            <div className="bg-amber-50/70 border border-amber-200/80 p-3 rounded text-[11px] font-serif text-amber-900 flex items-start gap-2">
              <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                You can change your login <strong>username</strong> and <strong>security password</strong> below.
                These credentials grant master access to the Super Admin governance suite.
              </span>
            </div>

            {/* Super Admin Username */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-700 mb-1">
                  Super Admin Username <span className="text-red-700">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={myUsername}
                  onChange={(e) => setMyUsername(e.target.value)}
                  placeholder="e.g. root"
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-none bg-white"
                />
                <span className="text-[10px] text-gray-500 mt-0.5 block font-serif">
                  Used in the Super Admin login column.
                </span>
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-700 mb-1">
                  Full Bureau / Staff Name <span className="text-red-700">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. MCC Editorial Bureau"
                  className="w-full px-3 py-2 text-xs font-serif font-bold border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-none bg-white"
                />
              </div>
            </div>

            {/* Password Section */}
            <div className="pt-3 border-t border-gray-200 space-y-3">
              <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-mcc-maroon block">
                Change Super Admin Password
              </span>

              {/* Current Password */}
              <div>
                <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password (e.g. root)"
                  className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-none bg-white"
                />
              </div>

              {/* New Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-700 mb-1">
                    New Security Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 4 chars)"
                    className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-none bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-serif font-bold text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selfSaving}
                className="px-4 py-2 bg-mcc-maroon hover:bg-mcc-maroon-dark text-white font-serif uppercase tracking-wider text-xs font-bold rounded shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-mcc-gold" />
                <span>{selfSaving ? 'Saving Credentials...' : 'Save Super Admin Credentials'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* TAB 2: ADMIN PASSWORD & CREDENTIALS (FOR SUPER ADMIN) */}
        {/* ============================================================== */}
        {activeTab === 'admin_credentials' && isSuper && (
          <form onSubmit={handleAdminSubmit} className="p-6 space-y-4">
            {adminSuccess && (
              <div className="p-3 rounded bg-emerald-50 border-l-4 border-emerald-700 text-emerald-900 text-xs font-serif flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{adminSuccess}</span>
              </div>
            )}

            {adminError && (
              <div className="p-3 rounded bg-red-50 border-l-4 border-red-700 text-red-900 text-xs font-serif flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                <span>{adminError}</span>
              </div>
            )}

            <div className="bg-blue-50/80 border border-blue-200 p-3 rounded text-[11px] font-serif text-blue-950 flex items-start gap-2">
              <Shield className="w-4 h-4 text-mcc-navy shrink-0 mt-0.5" />
              <span>
                As Super Admin, you can change the <strong>username</strong> and set a <strong>new password</strong> for
                the Administrator accounts below without needing their current password.
              </span>
            </div>

            {/* Select Admin Account */}
            <div>
              <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-700 mb-1">
                Select Admin Account to Modify
              </label>
              <select
                value={selectedAdminId}
                onChange={handleSelectAdmin}
                className="w-full px-3 py-2 text-xs font-serif border border-gray-300 rounded focus:border-mcc-navy outline-none bg-white font-medium"
              >
                {adminList.map((a) => (
                  <option key={a.id} value={a.id}>
                    #{a.id} • {a.name} (@{a.username || a.email}) — [{a.role}]
                  </option>
                ))}
              </select>
            </div>

            {/* Admin Username & Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-700 mb-1">
                  Admin Login Username <span className="text-red-700">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="e.g. admin"
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-gray-300 rounded focus:border-mcc-navy focus:ring-1 focus:ring-mcc-navy outline-none bg-white"
                />
                <span className="text-[10px] text-gray-500 mt-0.5 block font-serif">
                  Used by the admin in the Admin login column.
                </span>
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-700 mb-1">
                  Admin Full Name
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Administrator"
                  className="w-full px-3 py-2 text-xs font-serif border border-gray-300 rounded focus:border-mcc-navy outline-none bg-white"
                />
              </div>
            </div>

            {/* Set New Password for Admin */}
            <div className="pt-3 border-t border-gray-200 space-y-3">
              <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-mcc-navy block">
                Set New Password for Admin
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-700 mb-1">
                    New Admin Password
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="New password (min 4 chars)"
                    className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded focus:border-mcc-navy focus:ring-1 focus:ring-mcc-navy outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-700 mb-1">
                    Confirm Admin Password
                  </label>
                  <input
                    type="password"
                    value={adminConfirmPassword}
                    onChange={(e) => setAdminConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded focus:border-mcc-navy focus:ring-1 focus:ring-mcc-navy outline-none bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-serif font-bold text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adminSaving}
                className="px-4 py-2 bg-mcc-navy hover:bg-mcc-navy/90 text-white font-serif uppercase tracking-wider text-xs font-bold rounded shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-mcc-gold" />
                <span>{adminSaving ? 'Saving Admin...' : 'Save Admin Password & Credentials'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* TAB 3: DOSSIER & BIO */}
        {/* ============================================================== */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSelfSubmit} className="p-6 space-y-4">
            {selfSuccess && (
              <div className="p-3 rounded bg-emerald-50 border-l-4 border-emerald-700 text-emerald-900 text-xs font-serif flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{selfSuccess}</span>
              </div>
            )}

            {/* Email info */}
            <div>
              <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-700 mb-1">
                Institutional Email / Master Handle
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded text-xs font-mono text-gray-700">
                <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{user?.email}</span>
              </div>
            </div>

            {/* Avatar URL */}
            <div>
              <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-700 mb-1">
                Avatar Image URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/portraits/admin.jpg"
                className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded focus:border-mcc-maroon outline-none"
              />
            </div>

            {/* Biography */}
            <div>
              <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-700 mb-1">
                Editorial Biography
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Madras Christian College autonomous press and editorial suite administration..."
                className="w-full px-3 py-2 text-xs font-serif border border-gray-300 rounded focus:border-mcc-maroon outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-serif font-bold text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selfSaving}
                className="px-4 py-2 bg-mcc-maroon hover:bg-mcc-maroon-dark text-white font-serif uppercase tracking-wider text-xs font-bold rounded shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-mcc-gold" />
                <span>{selfSaving ? 'Saving Dossier...' : 'Update Dossier Details'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
