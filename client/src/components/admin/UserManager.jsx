import React, { useState, useEffect } from 'react';
import articleService from '../../services/articleService';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  Trash2,
  Edit3,
  CheckCircle,
  AlertCircle,
  X,
  RefreshCw,
  Building,
  Mail,
  Lock,
  Calendar,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

const ROLE_BADGES = {
  super_admin: { label: 'Super Admin', color: 'bg-red-100 text-red-900 border-red-300' },
  superadmin: { label: 'Super Admin', color: 'bg-red-100 text-red-900 border-red-300' },
  admin: { label: 'Editorial Admin', color: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
  editor: { label: 'Editor', color: 'bg-amber-100 text-amber-900 border-amber-300' },
  reporter: { label: 'Reporter', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  faculty: { label: 'Faculty', color: 'bg-blue-100 text-blue-900 border-blue-300' },
};

export default function UserManager() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Add User Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState('reporter');
  const [addDeptId, setAddDeptId] = useState('');
  const [addUsername, setAddUsername] = useState('');
  const [addingStaff, setAddingStaff] = useState(false);
  const [addError, setAddError] = useState(null);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editDeptId, setEditDeptId] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [updatingStaff, setUpdatingStaff] = useState(false);
  const [editError, setEditError] = useState(null);

  // Delete Confirm
  const [deletingUser, setDeletingUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load departments
  useEffect(() => {
    async function loadDepts() {
      try {
        const res = await articleService.getDepartments();
        if (res && res.data) {
          setDepartments(res.data);
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    }
    loadDepts();
  }, []);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await articleService.getUsers(params);
      if (res && res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Unable to load staff directory from administrative database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      setAddingStaff(true);
      setAddError(null);

      await articleService.createUser({
        name: addName.trim(),
        username: addUsername.trim() || undefined,
        email: addEmail.trim(),
        password: addPassword,
        role: addRole,
        department_id: addDeptId ? parseInt(addDeptId, 10) : null,
      });

      setNotification(`Staff contributor '${addName.trim()}' added successfully.`);
      setIsAddModalOpen(false);
      setAddName('');
      setAddUsername('');
      setAddEmail('');
      setAddPassword('');
      setAddRole('reporter');
      setAddDeptId('');
      fetchUsers();
    } catch (err) {
      console.error('Failed to create staff member:', err);
      setAddError(err.response?.data?.error || 'Failed to create staff member.');
    } finally {
      setAddingStaff(false);
    }
  };

  const handleOpenEdit = (targetUser) => {
    setEditingUser(targetUser);
    setEditUsername(targetUser.username || '');
    setEditPassword('');
    setEditRole(targetUser.role || 'reporter');
    setEditDeptId(targetUser.department_id ? String(targetUser.department_id) : '');
    setEditActive(Boolean(targetUser.is_active));
    setEditError(null);
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setUpdatingStaff(true);
      setEditError(null);

      const payload = {
        username: editUsername.trim(),
        role: editRole,
        department_id: editDeptId ? parseInt(editDeptId, 10) : null,
        is_active: editActive,
      };

      if (editPassword && editPassword.trim()) {
        if (editPassword.trim().length < 4) {
          setEditError('New password must be at least 4 characters long.');
          setUpdatingStaff(false);
          return;
        }
        payload.password = editPassword.trim();
      }

      await articleService.updateUser(editingUser.id, payload);

      setNotification(`Credentials & record for '${editingUser.name}' updated successfully.`);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Failed to update staff member:', err);
      setEditError(err.response?.data?.error || 'Failed to update staff record.');
    } finally {
      setUpdatingStaff(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deletingUser) return;
    try {
      setIsDeleting(true);
      await articleService.deleteUser(deletingUser.id);
      setNotification(`Account for '${deletingUser.name}' removed from newsroom.`);
      setDeletingUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Failed to delete staff member:', err);
      alert(err.response?.data?.error || 'Failed to delete staff member.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (targetUser) => {
    try {
      const newStatus = targetUser.is_active ? 0 : 1;
      await articleService.toggleUserStatus(targetUser.id, newStatus);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle account activation.');
    }
  };

  return (
    <div className="space-y-6 font-serif animate-in fade-in duration-300">
      {/* ============================================================== */}
      {/* 1. HEADER & ADD BUTTON */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-mcc-maroon pb-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-mcc-gold font-bold">
            Administrative Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Editorial Role & User Management Console
          </h1>
          <p className="text-xs text-gray-600 mt-0.5">
            Authorize newsroom personnel, assign collegiate editorial roles, and oversee staff access.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsAddModalOpen(true);
            setAddError(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-mcc-maroon hover:bg-mcc-maroon-dark text-white font-serif uppercase tracking-wider text-xs font-bold rounded shadow-xs transition-colors shrink-0"
        >
          <UserPlus className="w-4 h-4 text-mcc-gold" />
          <span>Add Admin / Staff Member</span>
        </button>
      </div>

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className="p-3.5 rounded bg-emerald-50 border-l-4 border-emerald-700 text-emerald-900 text-xs font-serif flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-gray-500 hover:text-gray-800 text-xs font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. SEARCH & ROLE FILTER BAR */}
      {/* ============================================================== */}
      <div className="bg-white border border-mcc-maroon/20 p-4 rounded-md shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Role Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-serif font-bold">
            {[
              { id: 'all', label: 'All Roles' },
              { id: 'superadmin', label: 'Super Admin' },
              { id: 'admin', label: 'Editorial Admins' },
              { id: 'editor', label: 'Editors' },
              { id: 'reporter', label: 'Reporters' },
              { id: 'faculty', label: 'Faculty' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id)}
                className={`px-3 py-1.5 rounded transition-all whitespace-nowrap ${
                  roleFilter === tab.id
                    ? 'bg-mcc-maroon text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-72">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff by name or email..."
                className="w-full pl-8 pr-3 py-1.5 text-xs font-serif border border-gray-300 rounded focus:border-mcc-maroon outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-mcc-navy hover:bg-mcc-navy/90 text-white text-xs font-serif font-bold rounded transition-colors"
            >
              Filter
            </button>
          </form>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. USERS DATA TABLE */}
      {/* ============================================================== */}
      <div className="bg-white border border-mcc-maroon/20 rounded-md shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-mcc-halfwhite border-b-2 border-mcc-maroon/20 text-xs font-serif uppercase tracking-wider text-mcc-maroon">
                <th className="py-3 px-4 font-bold">Staff Contributor</th>
                <th className="py-3 px-4 font-bold">Editorial Role</th>
                <th className="py-3 px-4 font-bold">Associated Department</th>
                <th className="py-3 px-4 font-bold text-center">Status</th>
                <th className="py-3 px-4 font-bold">Credential Date</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500 font-serif">
                    <RefreshCw className="w-6 h-6 text-mcc-maroon mx-auto animate-spin mb-2" />
                    <span>Loading staff directory...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500 font-serif">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <span>No staff accounts match your criteria.</span>
                  </td>
                </tr>
              ) : (
                users.map((staff) => {
                  const roleConfig = ROLE_BADGES[staff.role] || {
                    label: staff.role,
                    color: 'bg-gray-100 text-gray-700 border-gray-300',
                  };
                  const isCurrent = staff.id === currentUser?.id;

                  return (
                    <tr key={staff.id} className="hover:bg-mcc-halfwhite/50 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-mcc-navy text-mcc-gold flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                            {staff.avatar_url ? (
                              <img
                                src={staff.avatar_url}
                                alt={staff.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (staff.name || 'M')[0].toUpperCase()
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block leading-tight">
                              {staff.name}
                              {isCurrent && (
                                <span className="ml-1.5 text-[10px] text-mcc-maroon font-sans font-bold">
                                  (You)
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] text-gray-500 font-sans block">
                              {staff.email}
                            </span>
                            {staff.username && (
                              <span className="text-[10px] text-mcc-navy font-mono font-bold block">
                                Username: @{staff.username}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-serif uppercase tracking-wider font-bold border ${roleConfig.color}`}
                        >
                          {roleConfig.label}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4 whitespace-nowrap text-gray-700">
                        {staff.department_name ? (
                          <div className="flex items-center gap-1.5">
                            <Building className="w-3 h-3 text-mcc-gold shrink-0" />
                            <span>{staff.department_name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Central Administration</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          disabled={isCurrent}
                          onClick={() => handleToggleStatus(staff)}
                          title={isCurrent ? 'Cannot alter own account status' : 'Toggle account status'}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-bold border transition-colors ${
                            staff.is_active
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-red-50 text-red-800 border-red-300'
                          } ${isCurrent ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              staff.is_active ? 'bg-emerald-600' : 'bg-red-600'
                            }`}
                          />
                          <span>{staff.is_active ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Created Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-gray-500 text-[11px] font-sans">
                        {new Date(staff.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(staff)}
                            title="Edit Role & Department"
                            className="p-1.5 text-mcc-maroon hover:bg-mcc-maroon/10 rounded transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            disabled={isCurrent}
                            onClick={() => setDeletingUser(staff)}
                            title={isCurrent ? 'Cannot delete own account' : 'Remove Staff Member'}
                            className={`p-1.5 text-red-700 hover:bg-red-50 rounded transition-colors ${
                              isCurrent ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. ADD STAFF MODAL */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border-2 border-mcc-maroon max-w-lg w-full rounded-md shadow-2xl overflow-hidden font-serif">
            <div className="p-5 bg-mcc-halfwhite border-b border-mcc-maroon/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-mcc-maroon" />
                <h3 className="font-serif font-black text-base text-gray-900">
                  Add Staff Contributor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="m-5 p-3 rounded bg-red-50 border-l-4 border-red-700 text-red-900 text-xs">
                {addError}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-800 mb-1">
                  Full Contributor Name <span className="text-red-700">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Samuel J. Chelliah"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-mcc-maroon outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-800 mb-1">
                  Institutional Email Address <span className="text-red-700">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="e.g. samuel@mcc.edu.in"
                  className="w-full px-3 py-2 text-xs font-sans border border-gray-300 rounded focus:border-mcc-maroon outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-800 mb-1">
                  Login Username (Optional)
                </label>
                <input
                  type="text"
                  value={addUsername}
                  onChange={(e) => setAddUsername(e.target.value)}
                  placeholder="e.g. admin2, samuel_editor (defaults to email prefix)"
                  className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded focus:border-mcc-maroon outline-none"
                />
                <span className="text-[10px] text-gray-500 font-serif mt-0.5 block">
                  Staff member can use this username or their email to log into the administrative portal.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-800 mb-1">
                  Temporary Access Password <span className="text-red-700">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  placeholder="•••••••••••• (min 6 chars)"
                  className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded focus:border-mcc-maroon outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-800 mb-1">
                    Editorial Role <span className="text-red-700">*</span>
                  </label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-mcc-maroon outline-none bg-white font-medium"
                  >
                    <option value="admin">Editorial Admin (Full Administrative Control)</option>
                    <option value="editor">Senior Editor</option>
                    <option value="reporter">Staff Reporter</option>
                    <option value="faculty">Faculty Liaison</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-800 mb-1">
                    Associated Department
                  </label>
                  <select
                    value={addDeptId}
                    onChange={(e) => setAddDeptId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-mcc-maroon outline-none bg-white"
                  >
                    <option value="">ALL DEPARTMENTS</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingStaff}
                  className="px-4 py-2 bg-mcc-maroon hover:bg-mcc-maroon-dark text-white font-serif uppercase tracking-wider text-xs font-bold rounded shadow-xs disabled:opacity-50"
                >
                  {addingStaff ? 'Enrolling...' : 'Enroll Contributor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. EDIT STAFF MODAL */}
      {/* ============================================================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border-2 border-mcc-navy max-w-lg w-full rounded-md shadow-2xl overflow-hidden font-serif">
            <div className="p-5 bg-mcc-halfwhite border-b border-mcc-navy/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-mcc-navy" />
                <h3 className="font-serif font-black text-base text-gray-900">
                  Edit Contributor: {editingUser.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="m-5 p-3 rounded bg-red-50 border-l-4 border-red-700 text-red-900 text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateStaff} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-800 mb-1">
                  Login Username <span className="text-red-700">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="e.g. root, admin, editor_desk"
                  className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded focus:border-mcc-navy outline-none bg-white font-semibold"
                />
                <span className="text-[10px] text-gray-500 mt-0.5 block font-serif">
                  Used by staff/admin to log into the administrative portal.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-800 mb-1">
                  Set New Password (Optional)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep unchanged (min 4 chars)"
                  className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded focus:border-mcc-navy outline-none bg-white"
                />
                <span className="text-[10px] text-gray-500 mt-0.5 block font-serif">
                  Enter a new security password if you wish to change or reset this user's password.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-800 mb-1">
                  Editorial Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-mcc-navy outline-none bg-white font-medium"
                >
                  <option value="admin">Editorial Admin</option>
                  <option value="editor">Senior Editor</option>
                  <option value="reporter">Staff Reporter</option>
                  <option value="faculty">Faculty Liaison</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-800 mb-1">
                  Associated Department
                </label>
                <select
                  value={editDeptId}
                  onChange={(e) => setEditDeptId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-mcc-navy outline-none bg-white"
                >
                  <option value="">ALL DEPARTMENTS</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800">
                  <input
                    type="checkbox"
                    checked={editActive}
                    disabled={editingUser.id === currentUser?.id}
                    onChange={(e) => setEditActive(e.target.checked)}
                    className="w-4 h-4 text-mcc-navy accent-mcc-navy"
                  />
                  <span>Account Active (Authorizes login and dispatch creation)</span>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStaff}
                  className="px-4 py-2 bg-mcc-navy hover:bg-mcc-navy/90 text-white font-serif uppercase tracking-wider text-xs font-bold rounded shadow-xs disabled:opacity-50"
                >
                  {updatingStaff ? 'Updating...' : 'Save Staff Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. DELETE CONFIRMATION MODAL */}
      {/* ============================================================== */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border-2 border-red-700 max-w-md w-full rounded-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-serif font-black text-base text-gray-900">
                Revoke Staff Account Permanently
              </h3>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed font-serif">
              Are you certain you wish to delete the account for{' '}
              <strong className="text-gray-900">&ldquo;{deletingUser.name}&rdquo;</strong> (
              <span className="font-mono text-[11px]">{deletingUser.email}</span>)?
              This action cannot be undone.
            </p>
            <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                disabled={isDeleting}
                className="px-4 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStaff}
                disabled={isDeleting}
                className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white font-serif uppercase tracking-wider text-xs font-bold rounded shadow-xs"
              >
                {isDeleting ? 'Removing...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
