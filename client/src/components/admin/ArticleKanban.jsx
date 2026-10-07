import React, { useState, useEffect } from 'react';
import articleService from '../../services/articleService';
import { useAuth } from '../../context/AuthContext';
import { calculateReadingTime } from '../../utils/readingTime';
import {
  Columns,
  Search,
  Filter,
  Clock,
  Calendar,
  User,
  CheckCircle,
  ArrowRight,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Play,
  Send,
  Edit3,
  AlertCircle,
  BookOpen,
  Archive,
  Lightbulb,
  FileText,
  FileCheck,
  Plus,
  X,
  Briefcase,
  UserCheck,
} from 'lucide-react';

const KANBAN_COLUMNS = [
  {
    id: 'pitch',
    title: 'Pitches & Ideas',
    subtitle: 'Editorial Concepts',
    color: 'border-purple-500 bg-purple-50/50 text-purple-900',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Lightbulb,
  },
  {
    id: 'draft',
    title: 'Drafts in Progress',
    subtitle: 'Writers Desk',
    color: 'border-gray-400 bg-gray-50/50 text-gray-900',
    badgeColor: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: FileText,
  },
  {
    id: 'in_review',
    title: 'Under Review',
    subtitle: 'Copy Desk & Fact-Checking',
    color: 'border-amber-500 bg-amber-50/50 text-amber-900',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: FileCheck,
  },
  {
    id: 'scheduled',
    title: 'Scheduled Dispatches',
    subtitle: 'Embargo & Auto-Release',
    color: 'border-blue-500 bg-blue-50/50 text-blue-900',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Calendar,
  },
  {
    id: 'published',
    title: 'Published Gazette',
    subtitle: 'Live Campus Circulation',
    color: 'border-emerald-600 bg-emerald-50/50 text-emerald-900',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: CheckCircle,
  },
];

export default function ArticleKanban({ onEditArticle, onArticleSaved }) {
  const { user } = useAuth();
  const isEditorial = ['super_admin', 'editor'].includes(user?.role);

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [authorFilter, setAuthorFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [processingCron, setProcessingCron] = useState(false);

  // Story Assignment & Pitch Modal State (Task 98)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignTab, setAssignTab] = useState('new'); // 'new' | 'list'
  const [reportersList, setReportersList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);
  const [assignForm, setAssignForm] = useState({
    title: '',
    brief: '',
    assigned_to: '',
    department_id: '',
    deadline: '',
  });

  const loadAssignmentContext = async () => {
    try {
      const [usersRes, deptsRes, assignRes] = await Promise.all([
        articleService.getUsers().catch(() => ({ data: [] })),
        articleService.getDepartments().catch(() => ({ data: [] })),
        articleService.getAssignments().catch(() => ({ data: [] })),
      ]);
      const allUsers = usersRes?.data || [];
      const writers = allUsers.filter((u) => ['reporter', 'editor', 'super_admin'].includes(u.role));
      setReportersList(writers.length ? writers : allUsers);
      setDepartmentsList(deptsRes?.data || []);
      setAssignmentsList(assignRes?.data || []);
    } catch (e) {
      console.warn('Failed to load assignment context:', e.message);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!assignForm.title.trim() || !assignForm.brief.trim()) {
      alert('Please provide both a story lead title and an editorial brief.');
      return;
    }
    try {
      setAssignmentSubmitting(true);
      const payload = {
        title: assignForm.title.trim(),
        brief: assignForm.brief.trim(),
        assigned_to: assignForm.assigned_to ? parseInt(assignForm.assigned_to, 10) : null,
        department_id: assignForm.department_id ? parseInt(assignForm.department_id, 10) : null,
        deadline: assignForm.deadline || null,
      };
      await articleService.createAssignment(payload);
      setNotification(`Story pitch "${assignForm.title.trim()}" successfully assigned!`);
      setTimeout(() => setNotification(null), 4000);
      setAssignForm({ title: '', brief: '', assigned_to: '', department_id: '', deadline: '' });
      await loadAssignmentContext();
      setAssignTab('list');
    } catch (err) {
      console.error('Failed to create assignment:', err);
      alert(err.response?.data?.error || 'Failed to dispatch story assignment.');
    } finally {
      setAssignmentSubmitting(false);
    }
  };

  const handleUpdateAssignmentStatus = async (assignmentId, newStatus) => {
    try {
      await articleService.updateAssignmentStatus(assignmentId, newStatus);
      setNotification(`Assignment marked as '${newStatus}'.`);
      setTimeout(() => setNotification(null), 3500);
      setAssignmentsList((prev) =>
        prev.map((a) => (a.id === assignmentId ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update assignment status.');
    }
  };

  // Fetch all articles across pipeline
  const fetchPipelineArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch up to 50 active articles for the board
      const res = await articleService.getArticles({
        limit: 50,
        status: 'all',
      });
      if (res && res.data) {
        setArticles(res.data);
      }
    } catch (err) {
      console.error('Failed to load Kanban pipeline:', err);
      setError('Unable to load editorial pipeline articles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelineArticles();
  }, []);

  // Quick Status Transition
  const handleTransitionStatus = async (articleId, newStatus, scheduledDate = null) => {
    try {
      setUpdatingId(articleId);
      await articleService.updateArticleStatus(articleId, newStatus, scheduledDate);

      setArticles((prev) =>
        prev.map((art) =>
          art.id === articleId
            ? {
                ...art,
                status: newStatus,
                scheduled_at: scheduledDate || (newStatus === 'scheduled' ? art.scheduled_at : null),
                published_at: newStatus === 'published' ? new Date().toISOString() : art.published_at,
              }
            : art
        )
      );

      setNotification(`Dispatch status transitioned to '${newStatus.replace('_', ' ')}'.`);
      setTimeout(() => setNotification(null), 3500);
      if (onArticleSaved) onArticleSaved();
    } catch (err) {
      console.error('Failed to transition status:', err);
      alert(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Status transition rejected by server.'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Run Manual Cron Auto-Publisher Trigger
  const handleRunAutoPublisher = async () => {
    try {
      setProcessingCron(true);
      const res = await articleService.processScheduledArticles();
      const count = res?.publishedCount || 0;
      setNotification(`Auto-Publisher executed: ${count} scheduled dispatches went live!`);
      setTimeout(() => setNotification(null), 4500);
      fetchPipelineArticles();
    } catch (err) {
      console.error('Failed to trigger auto-publisher:', err);
      alert(err.response?.data?.error || 'Failed to trigger scheduled auto-publisher.');
    } finally {
      setProcessingCron(false);
    }
  };

  // Distinct authors for filter dropdown
  const authors = Array.from(
    new Set(articles.map((a) => a.author_name).filter(Boolean))
  );

  // Filtered articles
  const filteredArticles = articles.filter((art) => {
    const matchesSearch =
      !searchQuery.trim() ||
      art.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.author_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.category_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAuthor =
      authorFilter === 'all' || art.author_name === authorFilter;

    return matchesSearch && matchesAuthor;
  });

  return (
    <div className="space-y-6 font-serif animate-in fade-in duration-200">
      {/* 1. KANBAN TOOLBAR */}
      <div className="bg-white border border-mcc-maroon/20 p-4 rounded-md shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search & Author Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search story cards..."
              className="w-full pl-9 pr-3 py-1.5 text-xs font-serif border border-gray-300 rounded focus:border-mcc-maroon outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-mcc-gold" />
            <select
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-serif border border-gray-300 rounded focus:border-mcc-maroon outline-none bg-white"
            >
              <option value="all">All Journalists & Desks</option>
              {authors.map((auth) => (
                <option key={auth} value={auth}>
                  {auth}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Board Action Buttons */}
        <div className="flex items-center gap-3">
          {isEditorial && (
            <button
              type="button"
              onClick={() => {
                setShowAssignmentModal(true);
                loadAssignmentContext();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-mcc-maroon hover:bg-mcc-maroon-dark text-white text-xs font-serif uppercase tracking-wider font-bold rounded shadow-xs transition-colors"
              title="Pitch or assign story brief directly to reporter desk"
            >
              <Plus className="w-3.5 h-3.5 text-mcc-gold" />
              <span>Pitch / Assign Story</span>
            </button>
          )}

          {user?.role === 'super_admin' && (
            <button
              type="button"
              onClick={handleRunAutoPublisher}
              disabled={processingCron}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-mcc-navy hover:bg-mcc-navy-dark text-mcc-gold text-xs font-serif uppercase tracking-wider font-bold rounded shadow-xs transition-colors disabled:opacity-50"
              title="Immediately process and release scheduled stories"
            >
              <Play className="w-3.5 h-3.5 fill-mcc-gold" />
              <span>{processingCron ? 'Releasing...' : 'Run Auto-Publisher'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={fetchPipelineArticles}
            disabled={loading}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors"
            title="Refresh pipeline board"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-mcc-maroon' : ''}`} />
          </button>
        </div>
      </div>

      {/* NOTIFICATION */}
      {notification && (
        <div className="p-3 rounded bg-emerald-50 border-l-4 border-emerald-700 text-emerald-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-gray-700"
          >
            &times;
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded bg-red-50 border-l-4 border-red-700 text-red-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. KANBAN 5-COLUMN BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-6">
        {KANBAN_COLUMNS.map((col) => {
          // Normalize legacy under_review to in_review
          const columnArticles = filteredArticles.filter((art) => {
            const artStatus =
              art.status === 'under_review' || art.status === 'pending_review'
                ? 'in_review'
                : art.status;
            return artStatus === col.id;
          });

          const IconComponent = col.icon;

          return (
            <div
              key={col.id}
              className="bg-[#faf8f4] border border-gray-200 rounded-lg flex flex-col min-h-[580px] shadow-2xs overflow-hidden"
            >
              {/* Column Header */}
              <div
                className={`p-3.5 border-t-4 bg-white border-b border-gray-200 flex items-center justify-between ${col.color}`}
              >
                <div className="flex items-center gap-2">
                  <IconComponent className="w-4 h-4" />
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                      {col.title}
                    </h3>
                    <span className="text-[10px] text-gray-500 font-sans block">
                      {col.subtitle}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-sans font-bold border ${col.badgeColor}`}
                >
                  {columnArticles.length}
                </span>
              </div>

              {/* Column Cards Container */}
              <div className="p-2.5 flex-1 space-y-3 overflow-y-auto max-h-[70vh]">
                {columnArticles.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-xs italic">
                    No dispatches in this stage
                  </div>
                ) : (
                  columnArticles.map((art) => {
                    const reading = calculateReadingTime(art.content || art.summary || '');
                    const isUpdating = updatingId === art.id;

                    return (
                      <div
                        key={art.id}
                        className={`bg-white rounded border border-gray-200 p-3 shadow-2xs hover:shadow-md hover:border-mcc-maroon/40 transition-all flex flex-col justify-between space-y-2.5 ${
                          isUpdating ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        {/* Card Header: Category & Reading Time */}
                        <div className="flex items-center justify-between gap-2 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-mcc-maroon/10 text-mcc-maroon font-bold uppercase tracking-wider truncate max-w-[140px]">
                            {art.category_name || 'Broadsheet'}
                          </span>
                          <span className="text-gray-500 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-mcc-gold" />
                            <span>{reading.text}</span>
                          </span>
                        </div>

                        {/* Title & Excerpt */}
                        <div>
                          <h4
                            onClick={() => onEditArticle && onEditArticle(art)}
                            className="text-xs font-bold text-gray-900 hover:text-mcc-maroon cursor-pointer leading-snug line-clamp-2"
                            title={art.title}
                          >
                            {art.title}
                          </h4>
                          {art.summary && (
                            <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-normal font-sans">
                              {art.summary}
                            </p>
                          )}
                        </div>

                        {/* Author & Scheduled Notice */}
                        <div className="pt-1 border-t border-gray-100 flex flex-col gap-1 text-[11px] text-gray-600 font-sans">
                          <div className="flex items-center justify-between">
                            <span className="truncate text-gray-700 font-medium">
                              {art.author_name || 'Staff Reporter'}
                            </span>
                            <button
                              type="button"
                              onClick={() => onEditArticle && onEditArticle(art)}
                              className="text-gray-400 hover:text-mcc-maroon p-0.5 rounded"
                              title="Edit Story"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {art.scheduled_at && col.id === 'scheduled' && (
                            <div className="flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono">
                              <Calendar className="w-3 h-3 shrink-0" />
                              <span className="truncate">
                                {new Date(art.scheduled_at).toLocaleDateString()}{' '}
                                {new Date(art.scheduled_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Quick Status Advance Action Row */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Pitch column actions */}
                          {col.id === 'pitch' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleTransitionStatus(art.id, 'draft')}
                                className="px-2 py-1 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-bold"
                              >
                                Draft
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTransitionStatus(art.id, 'in_review')}
                                className="px-2 py-1 text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-bold"
                              >
                                Submit Review
                              </button>
                            </>
                          )}

                          {/* Draft column actions */}
                          {col.id === 'draft' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleTransitionStatus(art.id, 'pitch')}
                                className="px-2 py-1 text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-900 rounded font-bold"
                              >
                                &larr; Pitch
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTransitionStatus(art.id, 'in_review')}
                                className="px-2 py-1 text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-bold inline-flex items-center gap-1"
                              >
                                <span>Submit Review</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </>
                          )}

                          {/* In Review column actions */}
                          {col.id === 'in_review' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleTransitionStatus(art.id, 'draft')}
                                className="px-2 py-1 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-bold"
                              >
                                &larr; Return Draft
                              </button>
                              {isEditorial && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const defaultSchedule = new Date(
                                        Date.now() + 2 * 60 * 60 * 1000
                                      ).toISOString();
                                      handleTransitionStatus(art.id, 'scheduled', defaultSchedule);
                                    }}
                                    className="px-2 py-1 text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-900 rounded font-bold"
                                    title="Schedule for auto-publication"
                                  >
                                    Schedule
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleTransitionStatus(art.id, 'published')}
                                    className="px-2.5 py-1 text-[10px] bg-mcc-maroon hover:bg-mcc-maroon-dark text-white rounded font-bold inline-flex items-center gap-1"
                                  >
                                    <span>Publish</span>
                                    <CheckCircle className="w-3 h-3 text-mcc-gold" />
                                  </button>
                                </>
                              )}
                            </>
                          )}

                          {/* Scheduled column actions */}
                          {col.id === 'scheduled' && isEditorial && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleTransitionStatus(art.id, 'in_review')}
                                className="px-2 py-1 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-bold"
                              >
                                Cancel Schedule
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTransitionStatus(art.id, 'published')}
                                className="px-2.5 py-1 text-[10px] bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold inline-flex items-center gap-1"
                              >
                                <span>Publish Now</span>
                                <CheckCircle className="w-3 h-3 text-mcc-gold" />
                              </button>
                            </>
                          )}

                          {/* Published column actions */}
                          {col.id === 'published' && isEditorial && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleTransitionStatus(art.id, 'draft')}
                                className="px-2 py-1 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-bold"
                                title="Retract from circulation"
                              >
                                Retract
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTransitionStatus(art.id, 'archived')}
                                className="px-2 py-1 text-[10px] bg-red-50 hover:bg-red-100 text-red-900 rounded font-bold inline-flex items-center gap-1"
                              >
                                <Archive className="w-3 h-3" />
                                <span>Archive</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* 4. EDITORIAL ASSIGNMENT & PITCH MODAL (Task 98) */}
      {showAssignmentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-mcc-maroon/20 w-full max-w-2xl max-h-[90vh] flex flex-col font-serif overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-mcc-maroon text-white flex items-center justify-between border-b border-mcc-gold/30">
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-5 h-5 text-mcc-gold" />
                <div>
                  <h3 className="font-bold text-base tracking-wide">Editorial Desk Assignment & Pitch Pipeline</h3>
                  <p className="text-[11px] text-mcc-gold/90 uppercase tracking-widest font-sans font-semibold">
                    Commission reporting leads & track reporter dispatches
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignmentModal(false)}
                className="p-1 rounded text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-sans font-semibold">
              <button
                type="button"
                onClick={() => setAssignTab('new')}
                className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                  assignTab === 'new'
                    ? 'border-mcc-maroon text-mcc-maroon bg-white font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                + Assign New Story Lead
              </button>
              <button
                type="button"
                onClick={() => setAssignTab('list')}
                className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                  assignTab === 'list'
                    ? 'border-mcc-maroon text-mcc-maroon bg-white font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                Active Assignments ({assignmentsList.length})
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 text-xs">
              {assignTab === 'new' ? (
                <form onSubmit={handleCreateAssignment} className="space-y-4 font-sans">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-bold text-gray-700 mb-1">
                      Story Title / Working Headline <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={assignForm.title}
                      onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })}
                      placeholder="e.g., Annual Convocation 2026: Honorary Doctorates and Chancellor Address"
                      className="w-full px-3 py-2 text-xs font-serif border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-bold text-gray-700 mb-1">
                      Editorial Brief & Requirements <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={assignForm.brief}
                      onChange={(e) => setAssignForm({ ...assignForm, brief: e.target.value })}
                      placeholder="Outline angle, key interviewees (e.g. Bursar, Student Council), photographic angles, and required quotes..."
                      className="w-full px-3 py-2 text-xs font-serif border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-none resize-y"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider font-bold text-gray-700 mb-1">
                        Assigned Reporter / Journalist
                      </label>
                      <select
                        value={assignForm.assigned_to}
                        onChange={(e) => setAssignForm({ ...assignForm, assigned_to: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-serif border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-none bg-white"
                      >
                        <option value="">Unassigned (Open Desk Lead)</option>
                        {reportersList.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.role || 'Staff'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase tracking-wider font-bold text-gray-700 mb-1">
                        Academic Department (Optional)
                      </label>
                      <select
                        value={assignForm.department_id}
                        onChange={(e) => setAssignForm({ ...assignForm, department_id: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-serif border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-none bg-white"
                      >
                        <option value="">Campus-Wide / General</option>
                        {departmentsList.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-bold text-gray-700 mb-1">
                      Filing Deadline
                    </label>
                    <input
                      type="date"
                      value={assignForm.deadline}
                      onChange={(e) => setAssignForm({ ...assignForm, deadline: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-serif border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-3 font-sans">
                    <button
                      type="button"
                      onClick={() => setShowAssignmentModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={assignmentSubmitting}
                      className="px-5 py-2 bg-mcc-maroon hover:bg-mcc-maroon-dark text-white rounded text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5 text-mcc-gold" />
                      <span>{assignmentSubmitting ? 'Dispatching...' : 'Dispatch Assignment'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 font-sans">
                  {assignmentsList.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 font-serif italic">
                      No active editorial assignments found. Assign a story lead to get started.
                    </div>
                  ) : (
                    assignmentsList.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 border border-gray-200 rounded-md bg-gray-50/60 hover:bg-white hover:border-mcc-maroon/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                item.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.status === 'accepted'
                                  ? 'bg-blue-100 text-blue-800'
                                  : item.status === 'submitted'
                                  ? 'bg-purple-100 text-purple-800'
                                  : item.status === 'cancelled'
                                  ? 'bg-gray-100 text-gray-600 line-through'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.status}
                            </span>
                            <h4 className="font-serif font-bold text-sm text-mcc-maroon">{item.title}</h4>
                          </div>
                          <p className="text-[11px] text-gray-600 font-serif line-clamp-2">{item.brief}</p>
                          <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500 pt-1">
                            <span>
                              <strong>Reporter:</strong> {item.assigned_to_name || 'Unassigned'}
                            </span>
                            <span>
                              <strong>Assigned By:</strong> {item.assigned_by_name || 'Editor'}
                            </span>
                            {item.department_name && (
                              <span>
                                <strong>Dept:</strong> {item.department_name}
                              </span>
                            )}
                            {item.deadline && (
                              <span className="text-mcc-maroon font-semibold">
                                <strong>Deadline:</strong> {new Date(item.deadline).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.status !== 'completed' && item.status !== 'cancelled' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleUpdateAssignmentStatus(item.id, 'completed')}
                                className="px-2.5 py-1 text-[10px] bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold"
                              >
                                Complete
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateAssignmentStatus(item.id, 'cancelled')}
                                className="px-2 py-1 text-[10px] bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-semibold"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
