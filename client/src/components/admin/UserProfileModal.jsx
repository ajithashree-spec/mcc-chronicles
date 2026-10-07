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
  Image as ImageIcon,
} from 'lucide-react';

const ROLE_LABELS = {
  super_admin: { label: 'Super Administrator', color: 'bg-red-900/10 text-red-800 border-red-300' },
  editor: { label: 'Senior Broadsheet Editor', color: 'bg-mcc-gold/20 text-mcc-maroon border-mcc-gold' },
  reporter: { label: 'Staff Newsroom Reporter', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  faculty: { label: 'Academic Faculty Liaison', color: 'bg-blue-50 text-blue-800 border-blue-300' },
};

export default function UserProfileModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security'

  // Profile fields
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);

  // Security password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatar_url || '');
      setProfileError(null);
      setProfileSuccess(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError(null);
      setPasswordSuccess(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const currentRole = ROLE_LABELS[user?.role] || {
    label: user?.role || 'Staff Member',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      setProfileError(null);
      setProfileSuccess(null);

      const res = await articleService.updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl.trim(),
      });

      if (res && res.data) {
        setProfileSuccess('Dossier profile updated successfully.');
        if (updateUser) {
          updateUser(res.data);
        }
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      setProfileError(
        err.response?.data?.error ||
          'Failed to update profile. Please verify your connection and try again.'
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must contain at least 8 characters.');
      return;
    }

    try {
      setPasswordSaving(true);
      setPasswordError(null);
      setPasswordSuccess(null);

      await articleService.changePassword({
        currentPassword,
        newPassword,
      });

      setPasswordSuccess('Security credentials updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Password change failed:', err);
      setPasswordError(
        err.response?.data?.error ||
          'Failed to change password. Please check your current credentials.'
      );
    } finally {
      setPasswordSaving(false);
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
                Collegiate Staff Dossier
              </span>
              <h2
                id="profile-modal-title"
                className="text-lg font-serif font-black text-gray-900 leading-tight"
              >
                {user?.name || 'Staff Member'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-serif uppercase tracking-wider font-bold border ${currentRole.color}`}
                >
                  {currentRole.label}
                </span>
                {user?.department_name && (
                  <span className="text-[11px] text-gray-500 font-sans">
                    • {user.department_name}
                  </span>
                )}
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
        <div className="flex border-b border-gray-200 bg-gray-50/80 px-5 pt-2 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-1 font-serif text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-mcc-maroon text-mcc-maroon'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile Information</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`pb-2.5 px-1 font-serif text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-mcc-maroon text-mcc-maroon'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Change Security Password</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* 3. TAB 1: PROFILE INFORMATION */}
        {/* ============================================================== */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
            {profileSuccess && (
              <div className="p-3 rounded bg-emerald-50 border-l-4 border-emerald-700 text-emerald-900 text-xs font-serif flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="p-3 rounded bg-red-50 border-l-4 border-red-700 text-red-900 text-xs font-serif flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {/* Read-Only Institutional Email */}
            <div>
              <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-700 mb-1">
                Institutional Email (Fixed Identity)
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded text-xs font-sans text-gray-600">
                <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{user?.email}</span>
                <span className="ml-auto text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                  Immutable
                </span>
              </div>
              <span className="text-[10px] text-gray-500 mt-0.5 block font-serif">
                Institutional email addresses are managed centrally by the Registrar.
              </span>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-700 mb-1">
                Full Contributor Name <span className="text-red-700">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Arthur Miller"
                className="w-full px-3 py-2 text-xs font-serif border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-none"
              />
            </div>

            {/* Avatar URL */}
            <div>
              <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-700 mb-1">
                Avatar Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/portraits/miller.jpg"
                  className="flex-1 px-3 py-2 text-xs font-mono border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-none"
                />
              </div>
              <span className="text-[10px] text-gray-500 mt-0.5 block font-serif">
                Public portrait displayed alongside published dispatches.
              </span>
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
                placeholder="Faculty fellow and literary correspondent covering campus science expeditions..."
                className="w-full px-3 py-2 text-xs font-serif border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-none"
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
                disabled={profileSaving}
                className="px-4 py-2 bg-mcc-maroon hover:bg-mcc-maroon-dark text-white font-serif uppercase tracking-wider text-xs font-bold rounded shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 text-mcc-gold" />
                <span>{profileSaving ? 'Saving Dossier...' : 'Update Dossier Details'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* 4. TAB 2: CHANGE SECURITY PASSWORD */}
        {/* ============================================================== */}
        {activeTab === 'security' && (
          <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
            {passwordSuccess && (
              <div className="p-3 rounded bg-emerald-50 border-l-4 border-emerald-700 text-emerald-900 text-xs font-serif flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3 rounded bg-red-50 border-l-4 border-red-700 text-red-900 text-xs font-serif flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="bg-amber-50/70 border-l-4 border-amber-600 p-3 rounded text-[11px] font-serif text-amber-900 flex items-start gap-2">
              <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Passwords must be at least 8 characters in length. Security audit logs will
                record this credential update event.
              </span>
            </div>

            {/* Current Password */}
            <div>
              <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-700 mb-1">
                Current Password <span className="text-red-700">*</span>
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-none"
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-700 mb-1">
                New Security Password <span className="text-red-700">*</span>
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="•••••••••••• (min 8 chars)"
                className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-none"
              />
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-700 mb-1">
                Confirm New Password <span className="text-red-700">*</span>
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-none"
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
                disabled={passwordSaving}
                className="px-4 py-2 bg-mcc-navy hover:bg-mcc-navy/90 text-white font-serif uppercase tracking-wider text-xs font-bold rounded shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5 text-mcc-gold" />
                <span>{passwordSaving ? 'Updating...' : 'Authorize Password Change'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
