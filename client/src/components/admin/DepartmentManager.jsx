import React, { useState, useEffect, useMemo } from 'react';
import articleService from '../../services/articleService';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Mail,
  User,
  GraduationCap,
  Layers,
  X,
  Save,
  BookOpen,
} from 'lucide-react';

export default function DepartmentManager() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Filters
  const [streamFilter, setStreamFilter] = useState('All'); // 'All' | 'Aided' | 'Self-Financed'
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmDept, setDeleteConfirmDept] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    stream: 'Aided',
    head_of_department: '',
    contact_email: '',
    description: '',
  });

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await articleService.getDepartments();
      const list = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
      setDepartments(list);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
      setError('Unable to load academic departments. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const openAddModal = () => {
    setEditingDept(null);
    setFormData({
      name: '',
      code: '',
      stream: 'Aided',
      head_of_department: '',
      contact_email: '',
      description: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name || '',
      code: dept.code || '',
      stream: dept.stream || 'Aided',
      head_of_department: dept.head_of_department || '',
      contact_email: dept.contact_email || '',
      description: dept.description || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingDept(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      alert('Department Name and Unique Code are required.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingDept) {
        await articleService.updateDepartment(editingDept.id, formData);
        setNotification(`Department '${formData.name}' updated successfully.`);
      } else {
        await articleService.createDepartment(formData);
        setNotification(`Department '${formData.name}' created successfully.`);
      }
      closeModal();
      await fetchDepartments();
    } catch (err) {
      console.error('Save department error:', err);
      alert(err.response?.data?.error || 'Failed to save department.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (dept) => {
    try {
      setDeleting(true);
      await articleService.deleteDepartment(dept.id);
      setNotification(`Department '${dept.name}' deleted successfully.`);
      setDeleteConfirmDept(null);
      await fetchDepartments();
    } catch (err) {
      console.error('Delete department error:', err);
      alert(err.response?.data?.error || 'Failed to delete department.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered Roster
  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      const matchesSearch =
        d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.head_of_department?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStream =
        streamFilter === 'All' || d.stream === streamFilter;

      return matchesSearch && matchesStream;
    });
  }, [departments, searchQuery, streamFilter]);

  const stats = useMemo(() => {
    const total = departments.length;
    const aided = departments.filter((d) => d.stream === 'Aided').length;
    const sfs = departments.filter((d) => d.stream === 'Self-Financed').length;
    return { total, aided, sfs };
  }, [departments]);

  if (!isSuperAdmin) {
    return (
      <div className="p-8 bg-white border border-red-200 rounded-lg text-center font-serif">
        <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-2" />
        <h3 className="text-lg font-bold text-gray-900">Privilege Restricted</h3>
        <p className="text-xs text-gray-600 mt-1">
          Academic Department Management is reserved strictly for Super Administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-serif">
      {/* 1. HEADER & ACTIONS ROW */}
      <div className="bg-white p-5 rounded-lg border border-mcc-maroon/20 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-mcc-gold text-xs uppercase tracking-widest font-bold mb-1">
            <Building2 className="w-4 h-4 text-mcc-maroon" />
            <span>Collegiate Institutional Bureaus</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-950 uppercase tracking-tight">
            Academic Department Roster ({stats.total})
          </h2>
          <p className="text-xs text-gray-600 font-sans mt-0.5">
            Manage official Shift I (Aided) and Shift II (Self-Financed) departmental profiles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchDepartments}
            disabled={loading}
            className="p-2 border border-gray-300 rounded text-gray-700 hover:bg-mcc-paper transition-colors shadow-2xs"
            title="Refresh Roster"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 bg-mcc-maroon hover:bg-mcc-maroon-dark text-white rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* NOTIFICATION BANNER */}
      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-600 hover:text-emerald-900 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-mcc-maroon/10 text-mcc-maroon flex items-center justify-center font-black">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-sans text-gray-500 uppercase tracking-wider font-semibold">
              Total Bureaus
            </span>
            <div className="text-2xl font-black text-gray-900">{stats.total}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-mcc-navy/10 text-mcc-navy flex items-center justify-center font-black">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-sans text-gray-500 uppercase tracking-wider font-semibold">
              Aided (Shift I)
            </span>
            <div className="text-2xl font-black text-mcc-navy">{stats.aided}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-mcc-gold/20 text-yellow-800 flex items-center justify-center font-black">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-sans text-gray-500 uppercase tracking-wider font-semibold">
              Self-Financed (Shift II)
            </span>
            <div className="text-2xl font-black text-yellow-800">{stats.sfs}</div>
          </div>
        </div>
      </div>

      {/* 3. SEARCH & STREAM FILTER CONTROLS */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 font-sans">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by department name, code, or HOD..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-mcc-maroon"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500">Stream:</span>
          {['All', 'Aided', 'Self-Financed'].map((stream) => (
            <button
              key={stream}
              type="button"
              onClick={() => setStreamFilter(stream)}
              className={`px-3 py-1 text-xs rounded transition-all ${
                streamFilter === stream
                  ? 'bg-mcc-maroon text-white font-bold shadow-2xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {stream}
            </button>
          ))}
        </div>
      </div>

      {/* 4. RESPONSIVE DEPARTMENTS TABLE (HORIZONTAL SCROLL CONTAINED) */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-2xs overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-mcc-paper border-b border-gray-200 text-gray-700 uppercase tracking-wider font-sans text-[11px]">
              <tr>
                <th className="py-3 px-4 font-bold">Code</th>
                <th className="py-3 px-4 font-bold">Department Name</th>
                <th className="py-3 px-4 font-bold">Stream</th>
                <th className="py-3 px-4 font-bold">Head of Department</th>
                <th className="py-3 px-4 font-bold">Official Contact</th>
                <th className="py-3 px-4 font-bold text-center">Faculty Count</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 font-serif">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-mcc-maroon" />
                    <span>Loading collegiate department records...</span>
                  </td>
                </tr>
              ) : filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 font-serif">
                    No departments matching your query.
                  </td>
                </tr>
              ) : (
                filteredDepartments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-mcc-navy whitespace-nowrap">
                      {dept.code}
                    </td>
                    <td className="py-3 px-4 font-serif font-bold text-gray-950 text-sm max-w-xs">
                      <div>{dept.name}</div>
                      {dept.description && (
                        <p className="text-[11px] text-gray-500 line-clamp-1 font-sans font-normal mt-0.5">
                          {dept.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          dept.stream === 'Aided'
                            ? 'bg-blue-100 text-blue-900 border border-blue-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {dept.stream}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                      {dept.head_of_department ? (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>{dept.head_of_department}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Not Assigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                      {dept.contact_email ? (
                        <a
                          href={`mailto:${dept.contact_email}`}
                          className="flex items-center gap-1 hover:text-mcc-maroon transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span>{dept.contact_email}</span>
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-gray-700 whitespace-nowrap">
                      {dept.member_count || 0}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(dept)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-mcc-navy transition-colors"
                          title="Edit Department"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmDept(dept)}
                          className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-700 transition-colors"
                          title="Delete Department"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. ADD / EDIT DEPARTMENT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden border border-gray-300 font-serif my-8">
            <div className="bg-mcc-maroon text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-mcc-gold" />
                <h3 className="font-bold text-base uppercase tracking-wide">
                  {editingDept ? 'Edit Academic Department' : 'Register New Academic Department'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 font-sans text-xs">
              <div className="space-y-1">
                <label className="font-serif font-bold text-gray-800">Department Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Department of Botany"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-mcc-maroon focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-serif font-bold text-gray-800">Department Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. BOT-AID"
                    className="w-full p-2 border border-gray-300 rounded font-mono uppercase focus:ring-1 focus:ring-mcc-maroon focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-serif font-bold text-gray-800">Stream *</label>
                  <select
                    value={formData.stream}
                    onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-mcc-maroon focus:outline-none bg-white"
                  >
                    <option value="Aided">Aided (Shift I)</option>
                    <option value="Self-Financed">Self-Financed (Shift II)</option>
                    <option value="General">General Administrative</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-serif font-bold text-gray-800">Head of Department (HOD)</label>
                  <input
                    type="text"
                    value={formData.head_of_department}
                    onChange={(e) => setFormData({ ...formData, head_of_department: e.target.value })}
                    placeholder="e.g. Dr. Edward Livingston"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-mcc-maroon focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-serif font-bold text-gray-800">Official Contact Email</label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="e.g. hod.botany@mcc.edu.in"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-mcc-maroon focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-serif font-bold text-gray-800">Description / Focus Areas</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Outline academic disciplines, laboratory centers, and historical research..."
                  className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-mcc-maroon focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2 font-serif">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 text-xs uppercase tracking-wider font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-mcc-maroon hover:bg-mcc-maroon-dark text-white rounded text-xs uppercase tracking-wider font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Saving...' : editingDept ? 'Save Changes' : 'Create Department'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. DELETE CONFIRMATION MODAL */}
      {deleteConfirmDept && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4 border border-red-200 font-serif">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-gray-900">Confirm Deletion</h3>
              <p className="text-xs text-gray-600 font-sans">
                Are you sure you want to permanently delete{' '}
                <strong className="text-gray-900 font-serif">{deleteConfirmDept.name}</strong> ({deleteConfirmDept.code})?
                This action cannot be undone.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmDept(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 text-xs font-bold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmDept)}
                disabled={deleting}
                className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
