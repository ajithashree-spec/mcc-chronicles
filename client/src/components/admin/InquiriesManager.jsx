import React, { useState, useEffect } from 'react';
import articleService from '../../services/articleService';
import { useAuth } from '../../context/AuthContext';
import {
  Send,
  Mail,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Trash2,
  RefreshCw,
  AlertCircle,
  Eye,
  X,
  FileText,
  ShieldAlert,
  Globe,
  Save,
  MessageSquare,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'editorial_tip', label: 'Editorial Tip' },
  { value: 'general_inquiry', label: 'General Inquiry' },
  { value: 'correction', label: 'Correction Request' },
  { value: 'grievance', label: 'Campus Grievance' },
  { value: 'event_coverage', label: 'Event Coverage' },
];

const STATUS_PILLS = [
  { id: 'all', label: 'All Inquiries' },
  { id: 'unread', label: 'Unread' },
  { id: 'read', label: 'Read' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'resolved', label: 'Resolved' },
];

export default function InquiriesManager() {
  const { user } = useAuth();
  const isSuperAdmin =
    ['super_admin', 'superadmin'].includes(user?.role) ||
    user?.email === 'root' ||
    user?.username === 'root';

  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Drawer / Modal detail state
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [drawerNotes, setDrawerNotes] = useState('');
  const [drawerStatus, setDrawerStatus] = useState('read');
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;

      const res = await articleService.getInquiries(params);
      if (res && res.data) {
        setInquiries(res.data);
      }
    } catch (err) {
      console.error('Failed to load inquiries:', err);
      setError('Unable to load reader inquiries at this time.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [statusFilter, categoryFilter]);

  const openDrawer = (item) => {
    setSelectedInquiry(item);
    setDrawerNotes(item.admin_notes || '');
    setDrawerStatus(item.status || 'read');

    // Automatically mark unread messages as read upon viewing
    if (item.status === 'unread') {
      handleStatusChange(item.id, 'read', item.admin_notes || '');
    }
  };

  const closeDrawer = () => {
    setSelectedInquiry(null);
  };

  const handleStatusChange = async (id, newStatus, currentNotes) => {
    try {
      await articleService.updateInquiry(id, {
        status: newStatus,
        admin_notes: currentNotes !== undefined ? currentNotes : drawerNotes,
      });

      setInquiries((prev) =>
        prev.map((inq) =>
          inq.id === id ? { ...inq, status: newStatus, admin_notes: currentNotes !== undefined ? currentNotes : drawerNotes } : inq
        )
      );

      if (selectedInquiry?.id === id) {
        setSelectedInquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
        setDrawerStatus(newStatus);
      }

      setNotification(`Inquiry #${id} status updated to '${newStatus.replace('_', ' ')}'.`);
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      console.error('Failed to update inquiry status:', err);
      alert('Status update failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedInquiry) return;
    try {
      setSavingNotes(true);
      await articleService.updateInquiry(selectedInquiry.id, {
        status: drawerStatus,
        admin_notes: drawerNotes,
      });

      setInquiries((prev) =>
        prev.map((inq) =>
          inq.id === selectedInquiry.id
            ? { ...inq, status: drawerStatus, admin_notes: drawerNotes }
            : inq
        )
      );

      setSelectedInquiry((prev) =>
        prev ? { ...prev, status: drawerStatus, admin_notes: drawerNotes } : null
      );

      setNotification(`Editorial notes for inquiry #${selectedInquiry.id} saved.`);
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      console.error('Failed to save admin notes:', err);
      alert('Saving notes failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Permanently purge inquiry #${id} from the archival records?`)) return;
    try {
      await articleService.deleteInquiry(id);
      setInquiries((prev) => prev.filter((inq) => inq.id !== id));
      if (selectedInquiry?.id === id) {
        setSelectedInquiry(null);
      }
      setNotification(`Inquiry #${id} permanently purged.`);
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      console.error('Failed to delete inquiry:', err);
      alert('Delete failed: ' + (err.response?.data?.message || err.message));
    }
  };

  // Filter inquiries in-memory if search query is provided
  const filteredInquiries = inquiries.filter((inq) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      inq.name?.toLowerCase().includes(q) ||
      inq.email?.toLowerCase().includes(q) ||
      inq.subject?.toLowerCase().includes(q) ||
      inq.message?.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'unread':
        return 'bg-blue-100 text-blue-900 border-blue-300 font-bold';
      case 'read':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'in_progress':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      case 'resolved':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'editorial_tip':
        return 'bg-rose-50 text-mcc-maroon border-rose-200';
      case 'correction':
        return 'bg-purple-50 text-purple-900 border-purple-200';
      case 'grievance':
        return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'event_coverage':
        return 'bg-cyan-50 text-cyan-900 border-cyan-200';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. BROADCAST / CONSOLE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-mcc-maroon pb-4">
        <div>
          <span className="text-[11px] font-serif uppercase tracking-widest text-mcc-gold font-bold">
            Editorial Moderation Desk
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-gray-900 tracking-tight">
            Reader Inquiries & Editorial Tips
          </h1>
          <p className="text-xs text-gray-600 font-serif mt-0.5">
            Audit confidential scoops, reader inquiries, corrections, and campus grievances.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchInquiries}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-mcc-maroon/30 text-xs font-serif font-bold text-mcc-maroon hover:bg-mcc-maroon/5 rounded transition-colors self-start sm:self-auto shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Inbox</span>
        </button>
      </div>

      {/* 2. NOTIFICATIONS & ALERTS */}
      {notification && (
        <div className="p-3 rounded bg-emerald-50 border-l-4 border-emerald-700 text-emerald-900 text-xs font-serif flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded bg-red-50 border-l-4 border-red-700 text-red-900 text-xs font-serif flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-700 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. FILTER CONTROLS BAR */}
      <div className="bg-white border border-mcc-maroon/20 rounded p-4 space-y-3 shadow-xs">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-serif uppercase tracking-wider text-gray-500 font-bold mr-1">
            Status:
          </span>
          {STATUS_PILLS.map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setStatusFilter(pill.id)}
              className={`px-3 py-1 rounded text-xs font-serif transition-colors ${
                statusFilter === pill.id
                  ? 'bg-mcc-maroon text-white font-bold shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Secondary Filters: Category & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
          <div>
            <label className="block text-[11px] font-serif uppercase tracking-wider text-gray-600 font-bold mb-1">
              Filter by Category
            </label>
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-3 pr-8 py-1.5 text-xs font-serif bg-white border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-hidden appearance-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block text-[11px] font-serif uppercase tracking-wider text-gray-600 font-bold mb-1">
              Search Correspondence
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by sender, email, subject, or correspondence text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs font-serif bg-white border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-hidden placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. INQUIRIES DATA TABLE */}
      <div className="bg-white border border-mcc-maroon/20 rounded shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-mcc-navy text-white font-serif uppercase tracking-wider text-[11px] border-b-2 border-mcc-gold">
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Sender</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Received</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {loading && inquiries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-500 font-serif">
                    <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-mcc-maroon" />
                    Fetching reader correspondence...
                  </td>
                </tr>
              ) : filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-500 font-serif">
                    <Mail className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    No correspondence matches the specified filters.
                  </td>
                </tr>
              ) : (
                filteredInquiries.map((inq) => (
                  <tr
                    key={inq.id}
                    className={`hover:bg-[#fbfaf8] transition-colors ${
                      inq.status === 'unread' ? 'bg-blue-50/30 font-medium' : ''
                    }`}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border ${getStatusBadge(
                          inq.status
                        )}`}
                      >
                        {(inq.status || 'unread').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-serif font-bold text-gray-900 leading-tight">
                        {inq.name}
                      </div>
                      <div className="text-[11px] text-gray-500 font-sans">{inq.email}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-serif uppercase tracking-wider border ${getCategoryBadge(
                          inq.category
                        )}`}
                      >
                        {(inq.category || 'general').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-serif font-bold text-gray-900 truncate">
                        {inq.subject || 'Untitled Correspondence'}
                      </div>
                      <div className="text-[11px] text-gray-500 font-serif truncate mt-0.5">
                        {inq.message}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-600 font-serif">
                      {inq.created_at
                        ? new Date(inq.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-[11px] font-mono text-gray-500">
                      {inq.ip_address || '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openDrawer(inq)}
                          className="px-2.5 py-1 bg-mcc-navy text-white hover:bg-mcc-maroon rounded text-[11px] font-serif transition-colors flex items-center gap-1"
                          title="Open Message Details"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDelete(inq.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete Inquiry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. MESSAGE DRAWER / DETAIL MODAL */}
      {/* ============================================================== */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l-2 border-mcc-maroon overflow-hidden">
            {/* Drawer Header */}
            <div className="p-4 bg-mcc-navy text-white flex items-center justify-between border-b-2 border-mcc-gold">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-mcc-gold" />
                <h3 className="font-serif font-bold text-sm tracking-wide">
                  Correspondence #{selectedInquiry.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="p-1 rounded hover:bg-white/10 text-gray-300 hover:text-white"
                aria-label="Close Drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs font-serif">
              {/* Sender & Metadata Bar */}
              <div className="bg-[#faf8f4] border border-mcc-maroon/15 rounded p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${getCategoryBadge(
                      selectedInquiry.category
                    )}`}
                  >
                    {(selectedInquiry.category || 'general').replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-gray-500 font-sans">
                    {selectedInquiry.created_at
                      ? new Date(selectedInquiry.created_at).toLocaleString()
                      : ''}
                  </span>
                </div>

                <div className="pt-1">
                  <div className="text-sm font-serif font-black text-gray-900">
                    {selectedInquiry.name}
                  </div>
                  <div className="text-[11px] font-sans text-mcc-navy font-semibold">
                    {selectedInquiry.email}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono pt-1 border-t border-gray-200">
                  <Globe className="w-3 h-3 text-gray-400" />
                  <span>Sender IP: {selectedInquiry.ip_address || 'Not Recorded'}</span>
                </div>
              </div>

              {/* Subject */}
              <div>
                <h4 className="text-[11px] font-serif uppercase tracking-wider text-gray-500 font-bold mb-1">
                  Subject Line
                </h4>
                <div className="p-2.5 bg-gray-50 border border-gray-200 rounded font-serif font-bold text-sm text-gray-900">
                  {selectedInquiry.subject}
                </div>
              </div>

              {/* Message Content */}
              <div>
                <h4 className="text-[11px] font-serif uppercase tracking-wider text-gray-500 font-bold mb-1">
                  Full Correspondence Text
                </h4>
                <div className="p-4 bg-white border border-gray-200 rounded font-sans text-xs text-gray-800 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto shadow-inner">
                  {selectedInquiry.message}
                </div>
              </div>

              {/* Status Switcher */}
              <div>
                <h4 className="text-[11px] font-serif uppercase tracking-wider text-gray-500 font-bold mb-1.5">
                  Workflow Status Switcher
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'read', label: 'Mark Read' },
                    { id: 'in_progress', label: 'In Progress' },
                    { id: 'resolved', label: 'Resolved' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setDrawerStatus(st.id)}
                      className={`py-1.5 px-2 rounded text-center text-xs font-serif font-bold transition-all border ${
                        drawerStatus === st.id
                          ? 'bg-mcc-maroon text-white border-mcc-maroon shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <h4 className="text-[11px] font-serif uppercase tracking-wider text-gray-500 font-bold mb-1">
                  Editorial Admin Notes (Internal Only)
                </h4>
                <textarea
                  rows="3"
                  value={drawerNotes}
                  onChange={(e) => setDrawerNotes(e.target.value)}
                  placeholder="Record internal verification notes, follow-up reporter assignments, or factual checks..."
                  className="w-full p-2.5 text-xs font-sans bg-amber-50/50 border border-amber-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-hidden placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              {isSuperAdmin ? (
                <button
                  type="button"
                  onClick={() => handleDelete(selectedInquiry.id)}
                  className="px-3 py-1.5 text-xs font-serif text-red-700 hover:bg-red-100 rounded border border-red-300 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Inquiry</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="px-3 py-1.5 text-xs font-serif text-gray-600 hover:bg-gray-200 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="px-4 py-1.5 text-xs font-serif font-bold bg-mcc-maroon hover:bg-mcc-maroon/90 text-white rounded shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 text-mcc-gold" />
                  <span>{savingNotes ? 'Saving...' : 'Save & Update'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
