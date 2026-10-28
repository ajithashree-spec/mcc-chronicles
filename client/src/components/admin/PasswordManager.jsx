import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import articleService from '../../services/articleService';
import {
  KeyRound,
  Shield,
  Lock,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function PasswordManager() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Active option: 'superadmin' | 'admin'
  const [activeOption, setActiveOption] = useState('superadmin');

  // Super Admin form state
  const [superCurrentPassword, setSuperCurrentPassword] = useState('');
  const [superNewPassword, setSuperNewPassword] = useState('');
  const [superConfirmPassword, setSuperConfirmPassword] = useState('');
  const [showSuperCurrent, setShowSuperCurrent] = useState(false);
  const [showSuperNew, setShowSuperNew] = useState(false);
  const [showSuperConfirm, setShowSuperConfirm] = useState(false);
  const [superLoading, setSuperLoading] = useState(false);
  const [superError, setSuperError] = useState(null);
  const [superSuccess, setSuperSuccess] = useState(null);

  // Admin form state
  const [adminUsers, setAdminUsers] = useState([]);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [adminCurrentPassword, setAdminCurrentPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [showAdminCurrent, setShowAdminCurrent] = useState(false);
  const [showAdminNew, setShowAdminNew] = useState(false);
  const [showAdminConfirm, setShowAdminConfirm] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState(null);
  const [adminSuccess, setAdminSuccess] = useState(null);

  // Real-time mismatch & validation state for Super Admin
  const superMismatch =
    superConfirmPassword.length > 0 && superNewPassword !== superConfirmPassword;
  const superMatch =
    superConfirmPassword.length > 0 &&
    superNewPassword === superConfirmPassword &&
    superNewPassword.length >= 4;
  const superCanSubmit =
    superCurrentPassword.trim().length > 0 &&
    superNewPassword.length >= 4 &&
    superNewPassword === superConfirmPassword &&
    !superLoading;

  // Real-time mismatch & validation state for Admin
  const adminMismatch =
    adminConfirmPassword.length > 0 && adminNewPassword !== adminConfirmPassword;
  const adminMatch =
    adminConfirmPassword.length > 0 &&
    adminNewPassword === adminConfirmPassword &&
    adminNewPassword.length >= 4;
  const adminCanSubmit =
    adminCurrentPassword.trim().length > 0 &&
    adminNewPassword.length >= 4 &&
    adminNewPassword === adminConfirmPassword &&
    !adminLoading;

  // Fetch admin accounts list
  const loadAdminAccounts = async () => {
    try {
      const res = await articleService.getUsers();
      if (res && res.data) {
        // Filter to administrative staff (role admin, editor, or superadmin) excluding current logged-in user
        const admins = res.data.filter(
          (u) => u.id !== user?.id && ['admin', 'editor', 'super_admin', 'superadmin'].includes(u.role)
        );
        setAdminUsers(admins);

        // Find primary admin account (username 'admin' or role 'admin' or first)
        const primary = admins.find((u) => u.username === 'admin' || u.role === 'admin' || u.id === 1) || admins[0];
        if (primary) {
          setSelectedAdminId(String(primary.id));
        }
      }
    } catch (err) {
      console.error('Failed to load admin accounts:', err);
    }
  };

  useEffect(() => {
    loadAdminAccounts();
  }, [user?.id]);

  // Handle Super Admin password submit
  const handleSuperAdminSubmit = async (e) => {
    e.preventDefault();
    setSuperError(null);
    setSuperSuccess(null);

    // Strict validation
    if (!superCurrentPassword || !superCurrentPassword.trim()) {
      setSuperError('Please enter your existing Super Admin password.');
      return;
    }

    if (!superNewPassword || superNewPassword.length < 4) {
      setSuperError('New password must be at least 4 characters long.');
      return;
    }

    if (superNewPassword !== superConfirmPassword) {
      setSuperError('New passwords do not match. You must type the new password twice identically.');
      return;
    }

    try {
      setSuperLoading(true);
      const res = await articleService.changePassword({
        username: 'superadmin',
        currentPassword: superCurrentPassword.trim(),
        newPassword: superNewPassword,
        confirmPassword: superConfirmPassword,
      });

      setSuperSuccess(
        res.data?.message ||
          'Password updated successfully! Please log in with your new password.'
      );
      setSuperCurrentPassword('');
      setSuperNewPassword('');
      setSuperConfirmPassword('');
    } catch (err) {
      console.error('Super Admin password change failed:', err);
      const backendError = err.response?.data?.message || err.response?.data?.error;
      setSuperError(backendError || 'Current password is incorrect.');
    } finally {
      setSuperLoading(false);
    }
  };

  // Handle Admin password submit
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setAdminError(null);
    setAdminSuccess(null);

    if (!adminCurrentPassword || !adminCurrentPassword.trim()) {
      setAdminError("Please enter the Admin's existing password.");
      return;
    }

    if (!adminNewPassword || adminNewPassword.length < 4) {
      setAdminError('New password must be at least 4 characters long.');
      return;
    }

    if (adminNewPassword !== adminConfirmPassword) {
      setAdminError('New passwords do not match. You must type the new password twice identically.');
      return;
    }

    const targetUser = adminUsers.find((u) => String(u.id) === String(selectedAdminId)) || adminUsers[0];
    const targetUsername = targetUser?.username || targetUser?.email || 'admin';

    try {
      setAdminLoading(true);
      const res = await articleService.changePassword({
        username: targetUsername,
        currentPassword: adminCurrentPassword.trim(),
        newPassword: adminNewPassword,
        confirmPassword: adminConfirmPassword,
      });

      setAdminSuccess(
        res.data?.message ||
          `Password for @${targetUsername} updated successfully! Please log in with the new password.`
      );
      setAdminCurrentPassword('');
      setAdminNewPassword('');
      setAdminConfirmPassword('');
    } catch (err) {
      console.error('Admin password change failed:', err);
      const backendError = err.response?.data?.message || err.response?.data?.error;
      setAdminError(backendError || 'Current password is incorrect.');
    } finally {
      setAdminLoading(false);
    }
  };

  const selectedAdminObj = adminUsers.find((u) => String(u.id) === String(selectedAdminId));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. HEADER SECTION */}
      <div className="border-b-2 border-mcc-maroon pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-serif uppercase tracking-widest text-mcc-gold font-bold">
            Administrative Access Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-gray-900 tracking-tight">
            Change Administrative Passwords
          </h1>
          <p className="text-xs text-gray-600 font-serif mt-0.5">
            Strict credential modification for Super Administrative hierarchy and Editorial Desk administrators.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-mcc-maroon/10 text-mcc-maroon border border-mcc-maroon/20 rounded text-xs font-serif font-bold">
            <Lock className="w-3.5 h-3.5 text-mcc-gold" />
            <span>Cryptographic Bcrypt Hashing Active</span>
          </span>
        </div>
      </div>

      {/* 2. DUAL SELECTION TABS (Option 1: Super Admin | Option 2: Admin) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {/* Option 1: Change Password for Super Admin */}
        <button
          type="button"
          onClick={() => {
            setActiveOption('superadmin');
            setSuperError(null);
            setSuperSuccess(null);
          }}
          className={`p-4 rounded-md border text-left transition-all cursor-pointer relative ${
            activeOption === 'superadmin'
              ? 'bg-mcc-maroon text-white border-mcc-gold shadow-md'
              : 'bg-white text-gray-800 border-gray-200 hover:border-mcc-maroon/40 hover:bg-gray-50/50'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-sm shrink-0 ${
                activeOption === 'superadmin'
                  ? 'bg-mcc-gold text-mcc-navy font-bold'
                  : 'bg-mcc-maroon/10 text-mcc-maroon'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span
                className={`text-[10px] font-serif uppercase tracking-widest font-bold block ${
                  activeOption === 'superadmin' ? 'text-mcc-gold' : 'text-gray-500'
                }`}
              >
                Option 1
              </span>
              <h2 className="font-serif font-bold text-sm sm:text-base leading-tight mt-0.5">
                Change Password for Super Admin
              </h2>
              <p
                className={`text-xs mt-1 font-serif ${
                  activeOption === 'superadmin' ? 'text-gray-200' : 'text-gray-500'
                }`}
              >
                Master credentials for @superadmin with unrestricted access to governance suites.
              </p>
            </div>
          </div>
          {activeOption === 'superadmin' && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-mcc-gold" />
          )}
        </button>

        {/* Option 2: Change Password for Admin */}
        <button
          type="button"
          onClick={() => {
            setActiveOption('admin');
            setAdminError(null);
            setAdminSuccess(null);
          }}
          className={`p-4 rounded-md border text-left transition-all cursor-pointer relative ${
            activeOption === 'admin'
              ? 'bg-mcc-navy text-white border-mcc-gold shadow-md'
              : 'bg-white text-gray-800 border-gray-200 hover:border-mcc-navy/40 hover:bg-gray-50/50'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-sm shrink-0 ${
                activeOption === 'admin'
                  ? 'bg-mcc-gold text-mcc-navy font-bold'
                  : 'bg-mcc-navy/10 text-mcc-navy'
              }`}
            >
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span
                className={`text-[10px] font-serif uppercase tracking-widest font-bold block ${
                  activeOption === 'admin' ? 'text-mcc-gold' : 'text-gray-500'
                }`}
              >
                Option 2
              </span>
              <h2 className="font-serif font-bold text-sm sm:text-base leading-tight mt-0.5">
                Change Password for Admin
              </h2>
              <p
                className={`text-xs mt-1 font-serif ${
                  activeOption === 'admin' ? 'text-gray-200' : 'text-gray-500'
                }`}
              >
                Editorial desk credentials for @admin managing articles and gallery assets.
              </p>
            </div>
          </div>
          {activeOption === 'admin' && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-mcc-gold" />
          )}
        </button>
      </div>

      {/* ============================================================== */}
      {/* 3. OPTION 1 VIEW: CHANGE PASSWORD FOR SUPER ADMIN              */}
      {/* ============================================================== */}
      {activeOption === 'superadmin' && (
        <div className="bg-white border border-[#C5A059]/30 rounded-lg p-6 sm:p-8 shadow-xs max-w-2xl">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
            <Shield className="w-5 h-5 text-mcc-maroon" />
            <h2 className="font-serif font-black text-lg text-gray-900">
              Super Admin Password Modification
            </h2>
            <span className="ml-auto text-xs font-mono font-bold text-mcc-maroon bg-mcc-maroon/10 px-2 py-0.5 rounded">
              User: @superadmin
            </span>
          </div>

          {/* Success Banner with Direct Log In CTA */}
          {superSuccess && (
            <div className="mb-5 p-4 rounded-lg bg-emerald-50 border-2 border-emerald-600 text-emerald-950 text-xs font-serif animate-in fade-in space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>Password Changed Successfully!</span>
              </div>
              <p className="text-emerald-800 font-sans">
                {superSuccess}
              </p>
              <div className="pt-2 border-t border-emerald-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <span className="text-emerald-900 font-sans font-semibold">
                  Test your newly configured credentials on the login screen:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/superadmin/login?changed=superadmin&user=superadmin');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded font-serif font-bold text-xs uppercase tracking-wider transition-colors shadow-xs cursor-pointer shrink-0"
                >
                  <Lock className="w-3.5 h-3.5 text-mcc-gold" />
                  <span>Sign Out & Test Login →</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {superError && (
            <div className="mb-5 p-3.5 rounded bg-red-50 border-l-4 border-red-700 text-red-900 text-xs font-serif flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Password Change Denied</p>
                <p className="mt-0.5">{superError}</p>
              </div>
            </div>
          )}

          <div className="mb-5 bg-amber-50/80 border border-amber-200/80 p-3 rounded text-[11px] font-serif text-amber-950 flex items-start gap-2.5">
            <KeyRound className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Verification Requirement:</p>
              <p className="mt-0.5">
                You must correctly enter the existing password for the Super Admin account, and then type the new password twice to authorize the change.
              </p>
            </div>
          </div>

          <form onSubmit={handleSuperAdminSubmit} className="space-y-4">
            {/* Input 1: Existing Password */}
            <div>
              <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-800 mb-1">
                Existing Super Admin Password <span className="text-red-700">*</span>
              </label>
              <div className="relative">
                <input
                  type={showSuperCurrent ? 'text' : 'password'}
                  value={superCurrentPassword}
                  onChange={(e) => {
                    setSuperCurrentPassword(e.target.value);
                    setSuperError(null);
                  }}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2.5 text-xs font-mono border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSuperCurrent(!showSuperCurrent)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  title={showSuperCurrent ? 'Hide password' : 'Show password'}
                >
                  {showSuperCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Input 2: New Password */}
            <div>
              <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-800 mb-1">
                New Password <span className="text-red-700">*</span>
              </label>
              <div className="relative">
                <input
                  type={showSuperNew ? 'text' : 'password'}
                  value={superNewPassword}
                  onChange={(e) => {
                    setSuperNewPassword(e.target.value);
                    setSuperError(null);
                  }}
                  placeholder="Type new password (min 4 chars)"
                  className="w-full px-3.5 py-2.5 text-xs font-mono border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSuperNew(!showSuperNew)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  title={showSuperNew ? 'Hide password' : 'Show password'}
                >
                  {showSuperNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Input 3: Confirm New Password (Type Twice) */}
            <div>
              <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-800 mb-1">
                Confirm New Password (Type Again) <span className="text-red-700">*</span>
              </label>
              <div className="relative">
                <input
                  type={showSuperConfirm ? 'text' : 'password'}
                  value={superConfirmPassword}
                  onChange={(e) => {
                    setSuperConfirmPassword(e.target.value);
                    setSuperError(null);
                  }}
                  placeholder="Retype new password to confirm"
                  className={`w-full px-3.5 py-2.5 text-xs font-mono border rounded outline-none pr-10 transition-colors ${
                    superMismatch
                      ? 'border-red-500 bg-red-50/20 focus:ring-1 focus:ring-red-500'
                      : superMatch
                      ? 'border-emerald-500 bg-emerald-50/20 focus:ring-1 focus:ring-emerald-500'
                      : 'border-gray-300 focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowSuperConfirm(!showSuperConfirm)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  title={showSuperConfirm ? 'Hide password' : 'Show password'}
                >
                  {showSuperConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Real-time mismatch error or match confirmation */}
              {superMismatch && (
                <p className="mt-1 text-[11px] text-red-600 font-serif flex items-center gap-1 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>New passwords do not match. You must type the new password twice identically.</span>
                </p>
              )}
              {superMatch && (
                <p className="mt-1 text-[11px] text-emerald-600 font-serif flex items-center gap-1 animate-in fade-in">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>New passwords match identically.</span>
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200 flex justify-end">
              <button
                type="submit"
                disabled={superLoading}
                className="px-6 py-2.5 font-serif uppercase tracking-wider text-xs font-bold rounded shadow-sm transition-colors flex items-center gap-2 bg-mcc-maroon hover:bg-mcc-maroon-dark text-white cursor-pointer disabled:opacity-50"
              >
                {superLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-mcc-gold" />
                    <span>Verifying & Updating...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-mcc-gold" />
                    <span>Change Super Admin Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. OPTION 2 VIEW: CHANGE PASSWORD FOR ADMIN                    */}
      {/* ============================================================== */}
      {activeOption === 'admin' && (
        <div className="bg-white border border-[#C5A059]/30 rounded-lg p-6 sm:p-8 shadow-xs max-w-2xl">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
            <UserCheck className="w-5 h-5 text-mcc-navy" />
            <h2 className="font-serif font-black text-lg text-gray-900">
              Admin Password Modification
            </h2>
            <span className="ml-auto text-xs font-mono font-bold text-mcc-navy bg-mcc-navy/10 px-2 py-0.5 rounded">
              User: @{selectedAdminObj?.username || selectedAdminObj?.email || 'admin'}
            </span>
          </div>

          {/* Success Banner */}
          {adminSuccess && (
            <div className="mb-5 p-4 rounded-lg bg-emerald-50 border-2 border-emerald-600 text-emerald-950 text-xs font-serif animate-in fade-in space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>Admin Password Changed Successfully!</span>
              </div>
              <p className="text-emerald-800 font-sans">
                {adminSuccess}
              </p>
              <p className="text-emerald-900 font-sans font-semibold pt-1">
                The Admin user (@{selectedAdminObj?.username || selectedAdminObj?.email || 'admin'}) must now enter this new password to access the Editorial Desk.
              </p>
            </div>
          )}

          {/* Error Banner */}
          {adminError && (
            <div className="mb-5 p-3.5 rounded bg-red-50 border-l-4 border-red-700 text-red-900 text-xs font-serif flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Password Change Denied</p>
                <p className="mt-0.5">{adminError}</p>
              </div>
            </div>
          )}

          <div className="mb-5 bg-blue-50/80 border border-blue-200 p-3 rounded text-[11px] font-serif text-blue-950 flex items-start gap-2.5">
            <KeyRound className="w-4 h-4 text-mcc-navy shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Verification Requirement:</p>
              <p className="mt-0.5">
                To change the Admin password, you must correctly enter the existing password of the Administrator account, and then type the new password twice.
              </p>
            </div>
          </div>

          <form onSubmit={handleAdminSubmit} className="space-y-4">
            {/* Target Admin Account Info or Selector */}
            {adminUsers.length > 1 ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-serif uppercase tracking-wider font-bold text-gray-800">
                    Target Admin Account
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/superadmin?tab=users')}
                    className="text-[11px] font-serif font-bold text-mcc-navy hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>+ Add Another Admin</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <select
                  value={selectedAdminId}
                  onChange={(e) => {
                    setSelectedAdminId(e.target.value);
                    setAdminError(null);
                    setAdminSuccess(null);
                  }}
                  className="w-full px-3.5 py-2.5 text-xs font-serif border border-gray-300 rounded focus:border-mcc-navy outline-none bg-white font-semibold"
                >
                  {adminUsers.map((a) => (
                    <option key={a.id} value={a.id}>
                      #{a.id} • {a.name} (@{a.username || a.email}) — [{a.role}]
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-mcc-navy text-mcc-gold flex items-center justify-center font-bold text-xs shrink-0">
                    {(selectedAdminObj?.name || 'A')[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 text-xs block leading-tight">
                      {selectedAdminObj?.name || 'MCC Editorial Administrator'}
                    </span>
                    <span className="text-[11px] text-gray-500 font-mono block">
                      Username: @{selectedAdminObj?.username || 'admin'} • {selectedAdminObj?.email || 'admin@mcc.edu.in'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/superadmin?tab=users')}
                  className="text-[11px] font-serif font-bold text-mcc-navy hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>+ Add Another Admin</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Input 1: Existing Admin Password */}
            <div>
              <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-800 mb-1">
                Existing Admin Password <span className="text-red-700">*</span>
              </label>
              <div className="relative">
                <input
                  type={showAdminCurrent ? 'text' : 'password'}
                  value={adminCurrentPassword}
                  onChange={(e) => {
                    setAdminCurrentPassword(e.target.value);
                    setAdminError(null);
                  }}
                  placeholder="Enter existing Admin password"
                  className="w-full px-3.5 py-2.5 text-xs font-mono border border-gray-300 rounded focus:border-mcc-navy focus:ring-1 focus:ring-mcc-navy outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminCurrent(!showAdminCurrent)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  title={showAdminCurrent ? 'Hide password' : 'Show password'}
                >
                  {showAdminCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Input 2: New Password */}
            <div>
              <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-800 mb-1">
                New Admin Password <span className="text-red-700">*</span>
              </label>
              <div className="relative">
                <input
                  type={showAdminNew ? 'text' : 'password'}
                  value={adminNewPassword}
                  onChange={(e) => {
                    setAdminNewPassword(e.target.value);
                    setAdminError(null);
                  }}
                  placeholder="Type new password for Admin (min 4 chars)"
                  className="w-full px-3.5 py-2.5 text-xs font-mono border border-gray-300 rounded focus:border-mcc-navy focus:ring-1 focus:ring-mcc-navy outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminNew(!showAdminNew)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  title={showAdminNew ? 'Hide password' : 'Show password'}
                >
                  {showAdminNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Input 3: Confirm New Password (Type Twice) */}
            <div>
              <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-800 mb-1">
                Confirm New Admin Password (Type Again) <span className="text-red-700">*</span>
              </label>
              <div className="relative">
                <input
                  type={showAdminConfirm ? 'text' : 'password'}
                  value={adminConfirmPassword}
                  onChange={(e) => {
                    setAdminConfirmPassword(e.target.value);
                    setAdminError(null);
                  }}
                  placeholder="Retype new password to confirm"
                  className={`w-full px-3.5 py-2.5 text-xs font-mono border rounded outline-none pr-10 transition-colors ${
                    adminMismatch
                      ? 'border-red-500 bg-red-50/20 focus:ring-1 focus:ring-red-500'
                      : adminMatch
                      ? 'border-emerald-500 bg-emerald-50/20 focus:ring-1 focus:ring-emerald-500'
                      : 'border-gray-300 focus:border-mcc-navy focus:ring-1 focus:ring-mcc-navy'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowAdminConfirm(!showAdminConfirm)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  title={showAdminConfirm ? 'Hide password' : 'Show password'}
                >
                  {showAdminConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Real-time mismatch error or match confirmation */}
              {adminMismatch && (
                <p className="mt-1 text-[11px] text-red-600 font-serif flex items-center gap-1 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>New passwords do not match. You must type the new password twice identically.</span>
                </p>
              )}
              {adminMatch && (
                <p className="mt-1 text-[11px] text-emerald-600 font-serif flex items-center gap-1 animate-in fade-in">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>New passwords match identically.</span>
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200 flex justify-end">
              <button
                type="submit"
                disabled={adminLoading}
                className="px-6 py-2.5 font-serif uppercase tracking-wider text-xs font-bold rounded shadow-sm transition-colors flex items-center gap-2 bg-mcc-navy hover:bg-mcc-navy/90 text-white cursor-pointer disabled:opacity-50"
              >
                {adminLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-mcc-gold" />
                    <span>Verifying & Updating...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-mcc-gold" />
                    <span>Change Admin Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
