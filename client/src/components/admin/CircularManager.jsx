import React, { useState, useEffect } from 'react';
import articleService from '../../services/articleService';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  PlusCircle,
  Search,
  Filter,
  FileText,
  Paperclip,
  Edit3,
  Trash2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Pin,
  Calendar,
  X,
  Send,
  Users,
  Building,
} from 'lucide-react';

export default function CircularManager() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'superadmin';
  const isEditorial = ['super_admin', 'superadmin', 'editor', 'admin'].includes(user?.role);

  // Listing states
  const [circulars, setCirculars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Filters
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Department reference data
  const [departments, setDepartments] = useState([]);

  // Modal states for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCircular, setEditingCircular] = useState(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Form fields
  const [circularNumber, setCircularNumber] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [publishDate, setPublishDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isPinned, setIsPinned] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Delete confirm modal
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch departments
  useEffect(() => {
    async function loadDepartments() {
      try {
        const res = await articleService.getDepartments();
        if (res?.data) {
          setDepartments(res.data);
        }
      } catch (err) {
        console.error('Failed to load departments for circulars:', err);
      }
    }
    loadDepartments();
  }, []);

  // Fetch circulars
  const fetchCirculars = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (audienceFilter !== 'all') {
        params.target_audience = audienceFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await articleService.getCircularsList(params);
      if (res && res.data) {
        setCirculars(res.data);
      }
    } catch (err) {
      console.error('Failed to load circulars:', err);
      setError('Unable to load official circulars registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCirculars();
  }, [audienceFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCirculars();
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingCircular(null);
    setCircularNumber(`MCC/GAZETTE/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 900) + 100)}`);
    setTitle('');
    setContent('');
    setAttachmentUrl('');
    setDepartmentId(user?.department_id || '');
    setTargetAudience('all');
    setPublishDate(new Date().toISOString().split('T')[0]);
    setIsPinned(false);
    setIsActive(true);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (c) => {
    setEditingCircular(c);
    setCircularNumber(c.circular_number || '');
    setTitle(c.title || '');
    setContent(c.content || '');
    setAttachmentUrl(c.attachment_url || '');
    setDepartmentId(c.department_id || '');
    setTargetAudience(c.target_audience || 'all');
    setPublishDate(
      c.publish_date
        ? new Date(c.publish_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
    );
    setIsPinned(Boolean(c.is_pinned));
    setIsActive(c.is_active !== undefined ? Boolean(c.is_active) : true);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Submit Create or Edit
  const handleSaveCircular = async (e) => {
    e.preventDefault();
    setModalError(null);

    if (!circularNumber.trim()) {
      setModalError('Reference/Circular number is required (e.g. MCC/ADMIN/2026/01).');
      return;
    }
    if (!title.trim()) {
      setModalError('Official circular title is required.');
      return;
    }
    if (!publishDate) {
      setModalError('Publish date is required.');
      return;
    }

    try {
      setModalSubmitting(true);
      const payload = {
        circular_number: circularNumber.trim(),
        title: title.trim(),
        content: content.trim() || null,
        attachment_url: attachmentUrl.trim() || null,
        department_id: departmentId ? parseInt(departmentId, 10) : null,
        target_audience: targetAudience,
        publish_date: publishDate,
        is_pinned: isPinned,
        is_active: isActive,
      };

      if (editingCircular) {
        await articleService.updateCircular(editingCircular.id, payload);
        setNotification(`Circular ${payload.circular_number} updated successfully.`);
      } else {
        await articleService.createCircular(payload);
        setNotification(`Circular ${payload.circular_number} gazetted successfully.`);
      }

      setIsModalOpen(false);
      fetchCirculars();
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Failed to save circular:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Error saving circular notice.';
      setModalError(msg);
    } finally {
      setModalSubmitting(false);
    }
  };

  // Delete circular
  const confirmDeleteCircular = async () => {
    if (!deleteConfirmTarget) return;
    try {
      setIsDeleting(true);
      await articleService.deleteCircular(deleteConfirmTarget.id);
      setCirculars((prev) => prev.filter((c) => c.id !== deleteConfirmTarget.id));
      setDeleteConfirmTarget(null);
      setNotification('Circular notice removed from active records.');
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Failed to delete circular:', err);
      alert('Delete failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ============================================================== */}
      {/* 1. HEADER & ACTIONS */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-mcc-maroon pb-4">
        <div>
          <span className="text-[11px] font-serif uppercase tracking-widest text-mcc-gold font-bold">
            Administrative Gazette
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-gray-900 tracking-tight">
            Official Notices & Circulars Console
          </h1>
          <p className="text-xs text-gray-600 font-serif mt-0.5">
            Issue examination notices, academic directives, faculty announcements, and institutional decrees.
          </p>
        </div>

        {isEditorial && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-mcc-maroon hover:bg-mcc-maroon-dark text-white text-xs font-serif uppercase tracking-wider font-bold rounded shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-mcc-gold" />
            <span>Publish Official Circular</span>
          </button>
        )}
      </div>

      {/* NOTIFICATIONS */}
      {notification && (
        <div className="p-3.5 rounded bg-emerald-50 border-l-4 border-emerald-700 text-emerald-900 text-xs font-serif flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-gray-500 hover:text-gray-700 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded bg-red-50 border-l-4 border-red-700 text-red-900 text-xs font-serif flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-700 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchCirculars}
            className="underline font-bold text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. FILTER & SEARCH BAR */}
      {/* ============================================================== */}
      <div className="bg-white border border-mcc-maroon/20 p-4 rounded-md shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Audience filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs font-serif font-semibold">
          {[
            { id: 'all', label: 'All Audiences' },
            { id: 'students', label: 'Students' },
            { id: 'faculty', label: 'Faculty' },
            { id: 'staff', label: 'Staff' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setAudienceFilter(tab.id)}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                audienceFilter === tab.id
                  ? 'bg-mcc-navy text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search circulars..."
              className="w-full pl-8 pr-3 py-1.5 text-xs font-serif border border-gray-300 rounded focus:border-mcc-maroon outline-none"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          </div>

          <button
            type="submit"
            className="px-3 py-1.5 bg-mcc-maroon hover:bg-mcc-maroon-dark text-white text-xs font-serif font-bold rounded transition-colors"
          >
            Search
          </button>

          <button
            type="button"
            onClick={fetchCirculars}
            title="Refresh Registry"
            className="p-1.5 text-gray-500 hover:text-mcc-maroon hover:bg-gray-100 rounded border border-gray-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </form>
      </div>

      {/* ============================================================== */}
      {/* 3. CIRCULARS DATA TABLE */}
      {/* ============================================================== */}
      <div className="bg-white border border-mcc-maroon/20 rounded shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-mcc-halfwhite border-b border-mcc-maroon/20 text-gray-700 font-serif font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Ref Number</th>
                <th className="py-3 px-4">Title & Notice Details</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Audience</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4">Gazette Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && circulars.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 font-serif">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-mcc-maroon mb-2" />
                    <span>Loading gazette notices...</span>
                  </td>
                </tr>
              ) : circulars.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 font-serif">
                    <Bell className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="font-bold text-gray-700">No circulars found</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      No notices match the selected criteria or search term.
                    </p>
                  </td>
                </tr>
              ) : (
                circulars.map((c) => {
                  const dateStr = c.publish_date
                    ? new Date(c.publish_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'N/A';

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-mcc-halfwhite/60 transition-colors group"
                    >
                      {/* Circular Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-mcc-navy whitespace-nowrap">
                        {c.circular_number}
                      </td>

                      {/* Title & Preview */}
                      <td className="py-3.5 px-4 max-w-sm sm:max-w-md">
                        <div className="font-serif font-bold text-sm text-gray-900 group-hover:text-mcc-maroon transition-colors">
                          {c.title}
                        </div>
                        {c.content && (
                          <p className="text-[11px] text-gray-500 font-serif line-clamp-1 mt-0.5">
                            {c.content}
                          </p>
                        )}
                        {c.attachment_url && (
                          <div className="mt-1">
                            <a
                              href={c.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-blue-700 hover:underline font-serif font-semibold"
                            >
                              <Paperclip className="w-3 h-3" />
                              <span>View Attached Document</span>
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-serif text-gray-800">
                        {c.department_name || 'College Administration'}
                      </td>

                      {/* Target Audience */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-serif uppercase tracking-wider font-bold bg-gray-100 text-gray-700 border border-gray-200">
                          {c.target_audience}
                        </span>
                      </td>

                      {/* Priority Tag */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {c.is_pinned ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-serif uppercase tracking-wider font-bold bg-red-100 text-red-800 border border-red-300">
                            <Pin className="w-3 h-3 text-red-700" />
                            <span>Urgent / Pinned</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-serif uppercase tracking-wider font-medium text-gray-500 bg-gray-50 border border-gray-200">
                            Routine
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-serif text-gray-600 text-[11px]">
                        {dateStr}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isEditorial && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(c)}
                              title="Edit Circular"
                              className="p-1.5 text-mcc-maroon hover:bg-mcc-maroon/10 rounded transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}

                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmTarget(c)}
                              title="Delete Circular"
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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
      {/* 4. CIRCULAR CREATE / EDIT MODAL */}
      {/* ============================================================== */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-lg shadow-2xl border-t-4 border-mcc-maroon border-x border-b border-mcc-maroon/20 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-gray-900">
            {/* Header */}
            <div className="px-6 py-4 border-b border-mcc-maroon/15 flex items-center justify-between bg-mcc-halfwhite">
              <div>
                <span className="text-[10px] font-serif uppercase tracking-widest text-mcc-gold font-bold">
                  Gazette Registry
                </span>
                <h2 className="text-xl font-serif font-black text-gray-900">
                  {editingCircular ? `Edit Circular ${editingCircular.circular_number}` : 'Publish Official Circular'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error banner */}
            {modalError && (
              <div className="mx-6 mt-4 p-3 rounded bg-red-50 border-l-4 border-red-700 text-red-800 text-xs font-serif flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveCircular} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-800 mb-1">
                    Circular / Reference No. <span className="text-red-700">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={circularNumber}
                    onChange={(e) => setCircularNumber(e.target.value)}
                    placeholder="e.g. MCC/ADMIN/2026/04"
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-gray-300 rounded focus:border-mcc-maroon outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-800 mb-1">
                    Gazette / Publish Date <span className="text-red-700">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-serif border border-gray-300 rounded focus:border-mcc-maroon outline-none bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-800 mb-1">
                  Circular Title / Subject <span className="text-red-700">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Schedule of End Semester Examinations - Even Semester 2026"
                  className="w-full px-3.5 py-2.5 text-sm font-serif font-bold border border-gray-300 rounded focus:border-mcc-maroon outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-800 mb-1">
                    Issuing Department
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-serif border border-gray-300 rounded focus:border-mcc-maroon outline-none bg-white"
                  >
                    <option value="">ALL DEPARTMENTS</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-800 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-serif border border-gray-300 rounded focus:border-mcc-maroon outline-none bg-white font-medium"
                  >
                    <option value="all">All College Community</option>
                    <option value="students">Students Only</option>
                    <option value="faculty">Faculty Members Only</option>
                    <option value="staff">Administrative Staff</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-800 mb-1">
                  Attached Document / PDF Link URL
                </label>
                <input
                  type="url"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  placeholder="https://mcc.edu.in/documents/circular-2026-04.pdf"
                  className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded focus:border-mcc-maroon outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-800 mb-1">
                  Circular Directive / Text Body
                </label>
                <textarea
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter the full text notice or directive for broadsheet publication..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-sans leading-relaxed border border-gray-300 rounded focus:border-mcc-maroon outline-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="w-4 h-4 text-mcc-maroon rounded border-gray-300 focus:ring-mcc-maroon"
                  />
                  <span className="text-xs font-serif font-bold text-red-900">
                    Pin Notice / Mark as Urgent
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-mcc-maroon rounded border-gray-300 focus:ring-mcc-maroon"
                  />
                  <span className="text-xs font-serif font-bold text-gray-700">
                    Active Gazette Notice
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={modalSubmitting}
                  className="px-4 py-2 border border-gray-300 text-xs font-serif font-semibold text-gray-700 hover:bg-gray-50 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2 bg-mcc-maroon hover:bg-mcc-maroon-dark text-white text-xs font-serif uppercase tracking-wider font-bold rounded shadow-sm inline-flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-mcc-gold" />
                  <span>
                    {modalSubmitting
                      ? 'Gazetting...'
                      : editingCircular
                      ? 'Update Notice'
                      : 'Publish Circular'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. DELETE CONFIRMATION DIALOG */}
      {/* ============================================================== */}
      {deleteConfirmTarget && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-lg shadow-xl border-t-4 border-red-700 p-6 max-w-md w-full text-gray-900 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-gray-900">
                  Delete Circular Notice
                </h3>
                <p className="text-xs text-gray-500 font-serif">
                  Permanent removal from institutional gazette
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-700 font-serif leading-relaxed">
              Are you certain you wish to delete circular{' '}
              <span className="font-bold text-gray-900">
                "{deleteConfirmTarget.circular_number} - {deleteConfirmTarget.title}"
              </span>
              ?
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 border border-gray-300 text-xs font-serif font-semibold text-gray-700 hover:bg-gray-50 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCircular}
                disabled={isDeleting}
                className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-serif uppercase tracking-wider font-bold rounded shadow-sm inline-flex items-center gap-1.5"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
