import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import articleService from '../../services/articleService';
import { useAuth } from '../../context/AuthContext';
import {
  MessageSquare,
  Check,
  X,
  Trash2,
  RefreshCw,
  Search,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  User,
} from 'lucide-react';

const STATUS_FILTERS = [
  { id: 'all', label: 'All Comments' },
  { id: 'pending', label: 'Pending Review' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

export default function CommentsManager() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComments, setTotalComments] = useState(0);

  // Modal for inspecting full comment
  const [expandedComment, setExpandedComment] = useState(null);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: currentPage,
        limit: 15,
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await articleService.getAllComments(params);
      if (res && res.data) {
        setComments(res.data);
        setTotalComments(res.total ?? res.data.length);
        if (res.pagination?.totalPages) {
          setTotalPages(res.pagination.totalPages);
        } else {
          setTotalPages(Math.max(1, Math.ceil((res.total ?? res.data.length) / 15)));
        }
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
      setError('Unable to fetch reader comments for moderation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [statusFilter, currentPage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchComments();
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await articleService.updateCommentStatus(id, newStatus);
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus, is_approved: newStatus === 'approved' ? 1 : 0 } : c))
      );
      if (expandedComment?.id === id) {
        setExpandedComment((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      setNotification(`Comment #${id} marked as '${newStatus}'.`);
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Failed to update comment status:', err);
      alert('Status update failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Permanently remove comment #${id} from the records?`)) return;
    try {
      await articleService.deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
      if (expandedComment?.id === id) {
        setExpandedComment(null);
      }
      setNotification(`Comment #${id} permanently deleted.`);
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Failed to delete comment:', err);
      alert('Delete failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const getStatusBadge = (status, isApproved) => {
    const effective = status || (isApproved ? 'approved' : 'pending');
    switch (effective) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
      case 'rejected':
      case 'spam':
        return 'bg-red-100 text-red-900 border-red-300 font-bold';
      case 'pending':
      default:
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-mcc-maroon pb-4">
        <div>
          <span className="text-[11px] font-serif uppercase tracking-widest text-mcc-gold font-bold">
            Reader Discourse Moderation
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-gray-900 tracking-tight">
            Reader Comments Moderation Console
          </h1>
          <p className="text-xs text-gray-600 font-serif mt-0.5">
            Review and moderate comments submitted by readers across all published dispatches.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchComments}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-mcc-maroon/30 text-xs font-serif font-bold text-mcc-maroon hover:bg-mcc-maroon/5 rounded transition-colors self-start sm:self-auto shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
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

      {/* 3. FILTER & SEARCH CONTROLS */}
      <div className="bg-white border border-mcc-maroon/20 rounded p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-serif uppercase tracking-wider text-gray-500 font-bold mr-1">
            Status:
          </span>
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => {
                setStatusFilter(filter.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded text-xs font-serif transition-colors ${
                statusFilter === filter.id
                  ? 'bg-mcc-maroon text-white font-bold shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <form onSubmit={handleSearchSubmit} className="relative sm:w-72">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search comment, author, or article..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs font-serif bg-white border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-hidden placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
                fetchComments();
              }}
              className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 text-xs"
            >
              &times;
            </button>
          )}
        </form>
      </div>

      {/* 4. COMMENTS DATA TABLE */}
      <div className="bg-white border border-mcc-maroon/20 rounded shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-mcc-navy text-white font-serif uppercase tracking-wider text-[11px] border-b-2 border-mcc-gold">
                <th className="py-3 px-4">Article Title</th>
                <th className="py-3 px-4">Commenter</th>
                <th className="py-3 px-4">Comment Excerpt</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {loading && comments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500 font-serif">
                    <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-mcc-maroon" />
                    Loading reader comments...
                  </td>
                </tr>
              ) : comments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500 font-serif">
                    <MessageSquare className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    No comments found matching current filter criteria.
                  </td>
                </tr>
              ) : (
                comments.map((comment) => {
                  const effectiveStatus = comment.status || (comment.is_approved ? 'approved' : 'pending');
                  return (
                    <tr
                      key={comment.id}
                      className={`hover:bg-[#fbfaf8] transition-colors ${
                        effectiveStatus === 'pending' ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Article Title & Link */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-serif font-bold text-gray-900 line-clamp-1">
                          {comment.article_title || `Article #${comment.article_id}`}
                        </div>
                        {comment.article_slug ? (
                          <Link
                            to={`/article/${comment.article_slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-mcc-maroon hover:underline font-serif mt-0.5"
                          >
                            <span>View dispatch</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-mono">ID: {comment.article_id}</span>
                        )}
                      </td>

                      {/* Commenter Name & Email */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-serif font-bold text-gray-900 leading-tight">
                          {comment.author_name}
                        </div>
                        <div className="text-[11px] text-gray-500 font-sans">
                          {comment.author_email}
                        </div>
                      </td>

                      {/* Comment Excerpt */}
                      <td className="py-3 px-4 max-w-sm">
                        <p
                          onClick={() => setExpandedComment(comment)}
                          className="font-serif text-gray-700 line-clamp-2 cursor-pointer hover:text-mcc-maroon transition-colors"
                          title="Click to view full comment"
                        >
                          "{comment.content}"
                        </p>
                      </td>

                      {/* Submission Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-gray-600 font-serif">
                        {comment.created_at
                          ? new Date(comment.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border ${getStatusBadge(
                            comment.status,
                            comment.is_approved
                          )}`}
                        >
                          {effectiveStatus}
                        </span>
                      </td>

                      {/* Moderation Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approve (Green Check) */}
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(comment.id, 'approved')}
                            disabled={effectiveStatus === 'approved'}
                            className={`p-1.5 rounded transition-colors ${
                              effectiveStatus === 'approved'
                                ? 'bg-emerald-50 text-emerald-300 cursor-not-allowed'
                                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            }`}
                            title="Approve Comment"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>

                          {/* Reject (Red Cross) */}
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(comment.id, 'rejected')}
                            disabled={effectiveStatus === 'rejected'}
                            className={`p-1.5 rounded transition-colors ${
                              effectiveStatus === 'rejected'
                                ? 'bg-rose-50 text-rose-300 cursor-not-allowed'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                            title="Reject Comment"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(comment.id)}
                            className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Purge Comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* 5. PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs font-serif text-gray-600">
            <div>
              Showing page <span className="font-bold">{currentPage}</span> of{' '}
              <span className="font-bold">{totalPages}</span> ({totalComments} total comments)
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 border border-gray-300 rounded bg-white hover:bg-gray-100 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-2 py-1 border border-gray-300 rounded bg-white hover:bg-gray-100 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 6. EXPANDED COMMENT MODAL */}
      {/* ============================================================== */}
      {expandedComment && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg border-2 border-mcc-maroon max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="p-4 bg-mcc-navy text-white flex items-center justify-between border-b-2 border-mcc-gold">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-mcc-gold" />
                <h3 className="font-serif font-bold text-sm">
                  Comment Review #{expandedComment.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExpandedComment(null)}
                className="text-gray-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-serif">
              <div className="bg-[#faf8f4] p-3 rounded border border-mcc-maroon/15 space-y-1">
                <div className="font-serif font-bold text-gray-900 text-sm">
                  {expandedComment.author_name}
                </div>
                <div className="text-gray-500 font-sans">{expandedComment.author_email}</div>
                <div className="text-[11px] text-mcc-navy font-serif pt-1">
                  On article:{' '}
                  <span className="font-bold">
                    {expandedComment.article_title || `#${expandedComment.article_id}`}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-serif uppercase tracking-wider text-gray-500 font-bold mb-1">
                  Full Reader Comment
                </h4>
                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded font-sans leading-relaxed text-gray-800 whitespace-pre-wrap">
                  {expandedComment.content}
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDelete(expandedComment.id)}
                className="px-3 py-1.5 text-xs font-serif text-red-700 hover:bg-red-50 rounded border border-red-200 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(expandedComment.id, 'rejected')}
                  className="px-3 py-1.5 text-xs font-serif font-bold bg-rose-100 text-rose-900 hover:bg-rose-200 rounded flex items-center gap-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(expandedComment.id, 'approved')}
                  className="px-4 py-1.5 text-xs font-serif font-bold bg-emerald-700 text-white hover:bg-emerald-800 rounded flex items-center gap-1 shadow-sm transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
