import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import articleService from '../../services/articleService';
import { useAuth } from '../../context/AuthContext';
import ArticleEditorModal from './ArticleEditorModal';
import RevisionHistoryModal from './RevisionHistoryModal';
import {
  Search,
  Filter,
  PlusCircle,
  Edit3,
  Trash2,
  ExternalLink,
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  History,
} from 'lucide-react';

export default function ArticleManager({ onComposeArticle }) {
  const { user } = useAuth();
  const isEditorial = ['super_admin', 'editor'].includes(user?.role);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  // Data states
  const [articles, setArticles] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Editor Modal states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Revision History Modal states (Task 87)
  const [revisionModalArticle, setRevisionModalArticle] = useState(null);

  // Delete Confirm modal states
  const [deleteConfirmArticle, setDeleteConfirmArticle] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Fetch Categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await articleService.getCategories();
        if (res?.data) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Fetch Articles when filters change
  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      } else {
        params.status = 'all';
      }

      if (categoryFilter) {
        params.category_id = categoryFilter;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await articleService.getArticles(params);
      if (res && res.data) {
        setArticles(res.data);
        setTotalCount(res.pagination?.total || res.data.length);
      }
    } catch (err) {
      console.error('Failed to load articles:', err);
      setError('Unable to retrieve article dispatches. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [statusFilter, categoryFilter, currentPage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchArticles();
  };

  // Open editor for new article
  const handleCreateNew = () => {
    setSelectedArticle(null);
    setIsEditorOpen(true);
  };

  // Open editor for existing article
  const handleEdit = (article) => {
    setSelectedArticle(article);
    setIsEditorOpen(true);
  };

  // Handle article saved callback
  const handleArticleSaved = () => {
    fetchArticles();
    setNotification('Article dispatch committed successfully.');
    setTimeout(() => setNotification(null), 4000);
  };

  // Quick toggle status (published <-> draft)
  const handleToggleStatus = async (article) => {
    const nextStatus = article.status === 'published' ? 'draft' : 'published';
    try {
      await articleService.updateArticle(article.id, {
        status: nextStatus,
      });
      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, status: nextStatus } : a))
      );
      setNotification(`Status for "${article.title}" toggled to ${nextStatus}.`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Failed to toggle status:', err);
      alert('Could not toggle status: ' + (err.response?.data?.error || err.message));
    }
  };

  // Delete handling
  const confirmDelete = async () => {
    if (!deleteConfirmArticle) return;
    try {
      setIsDeleting(true);
      await articleService.deleteArticle(deleteConfirmArticle.id);
      setArticles((prev) => prev.filter((a) => a.id !== deleteConfirmArticle.id));
      setDeleteConfirmArticle(null);
      setNotification('Dispatch successfully purged from broadsheet archives.');
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Failed to delete article:', err);
      alert('Delete failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsDeleting(false);
    }
  };

  // Total pages
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  // Status Badge styling
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-serif font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Published</span>
          </span>
        );
      case 'under_review':
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-serif font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span>Under Review</span>
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-serif font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            <span>Draft</span>
          </span>
        );
      case 'archived':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-serif font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-300">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            <span>Archived</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ============================================================== */}
      {/* 1. SECTION HEADER & COMPOSE TRIGGER */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-mcc-maroon pb-4">
        <div>
          <span className="text-[11px] font-serif uppercase tracking-widest text-mcc-gold font-bold">
            Editorial Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-gray-900 tracking-tight">
            Articles & Dispatches Desk
          </h1>
          <p className="text-xs text-gray-600 font-serif mt-0.5">
            Curate, edit, and publish campus dispatches, long-form essays, and news broadcasts.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-mcc-maroon hover:bg-mcc-maroon-dark text-white text-xs font-serif uppercase tracking-wider font-bold rounded shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4 text-mcc-gold" />
          <span>Compose New Dispatch</span>
        </button>
      </div>

      {/* NOTIFICATION TOAST */}
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
            onClick={fetchArticles}
            className="underline font-bold text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. SEARCH & FILTER BAR */}
      {/* ============================================================== */}
      <div className="bg-white border border-mcc-maroon/20 p-4 rounded-md shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 text-xs font-serif font-semibold border-b sm:border-0 border-gray-100">
            {[
              { id: 'all', label: 'All Dispatches' },
              { id: 'published', label: 'Published' },
              { id: 'draft', label: 'Drafts' },
              { id: 'under_review', label: 'Under Review' },
              { id: 'archived', label: 'Archived' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-mcc-maroon text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Category Filter */}
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs font-serif border border-gray-300 rounded focus:border-mcc-maroon outline-none bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search headlines..."
                className="w-full pl-8 pr-3 py-1.5 text-xs font-serif border border-gray-300 rounded focus:border-mcc-maroon outline-none"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            </div>

            <button
              type="submit"
              className="px-3 py-1.5 bg-mcc-navy hover:bg-mcc-maroon text-white text-xs font-serif font-bold rounded transition-colors"
            >
              Search
            </button>

            <button
              type="button"
              onClick={fetchArticles}
              title="Refresh"
              className="p-1.5 text-gray-500 hover:text-mcc-maroon hover:bg-gray-100 rounded border border-gray-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </form>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. ARTICLES DATA TABLE */}
      {/* ============================================================== */}
      <div className="bg-white border border-mcc-maroon/20 rounded shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-mcc-halfwhite border-b border-mcc-maroon/20 text-gray-700 font-serif font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Headline & Excerpt</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4 text-center">Views</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Published Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && articles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 font-serif">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-mcc-maroon mb-2" />
                    <span>Loading dispatch archives...</span>
                  </td>
                </tr>
              ) : articles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 font-serif">
                    <FileText className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="font-bold text-gray-700">No dispatches match this criteria</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Try clearing filters or compose a new dispatch.
                    </p>
                  </td>
                </tr>
              ) : (
                articles.map((article) => {
                  const formattedDate = article.published_at
                    ? new Date(article.published_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : article.created_at
                    ? new Date(article.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Draft';

                  return (
                    <tr
                      key={article.id}
                      className="hover:bg-mcc-halfwhite/60 transition-colors group"
                    >
                      {/* Title & Excerpt */}
                      <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                        <div className="font-serif font-bold text-sm text-gray-900 group-hover:text-mcc-maroon transition-colors line-clamp-1">
                          {article.title}
                        </div>
                        {article.summary && (
                          <p className="text-[11px] text-gray-500 font-serif line-clamp-1 mt-0.5">
                            {article.summary}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono mt-1">
                          <span>ID #{article.id}</span>
                          {article.is_featured ? (
                            <span className="text-amber-700 font-bold bg-amber-50 px-1 rounded">
                              Featured
                            </span>
                          ) : null}
                          {article.is_breaking ? (
                            <span className="text-red-700 font-bold bg-red-50 px-1 rounded">
                              Breaking
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-serif text-gray-800 font-semibold">
                          {article.category_name || 'Broadsheet'}
                        </span>
                        {article.department_name && (
                          <div className="text-[10px] text-gray-500 truncate max-w-[120px]">
                            {article.department_name}
                          </div>
                        )}
                      </td>

                      {/* Author */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-serif text-gray-700">
                        {article.author_name || 'Staff Reporter'}
                      </td>

                      {/* Views */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-bold text-gray-700 font-sans">
                          <Eye className="w-3 h-3 text-mcc-maroon" />
                          <span>{article.views_count?.toLocaleString() || 0}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {renderStatusBadge(article.status)}
                      </td>

                      {/* Published Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-serif text-gray-600 text-[11px]">
                        {formattedDate}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Toggle Status */}
                          {isEditorial && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(article)}
                              title={`Toggle status to ${
                                article.status === 'published' ? 'Draft' : 'Published'
                              }`}
                              className="p-1.5 text-gray-500 hover:text-mcc-navy hover:bg-gray-100 rounded transition-colors"
                            >
                              {article.status === 'published' ? (
                                <ToggleRight className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <ToggleLeft className="w-4 h-4 text-amber-600" />
                              )}
                            </button>
                          )}

                          {/* Preview Link */}
                          <Link
                            to={`/article/${article.slug || article.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Preview on Public Broadsheet"
                            className="p-1.5 text-gray-500 hover:text-mcc-navy hover:bg-gray-100 rounded transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          {/* Edit Dispatch */}
                          <button
                            type="button"
                            onClick={() => handleEdit(article)}
                            title="Edit Dispatch"
                            className="p-1.5 text-mcc-maroon hover:bg-mcc-maroon/10 rounded transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Editorial History / Revisions (Task 87) */}
                          <button
                            type="button"
                            onClick={() => setRevisionModalArticle(article)}
                            title="Editorial Snapshot Ledger & Revision Trail"
                            className="p-1.5 text-mcc-navy hover:bg-mcc-navy/10 rounded transition-colors"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Delete Dispatch */}
                          {isEditorial && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmArticle(article)}
                              title="Delete Dispatch"
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

        {/* ============================================================== */}
        {/* 4. PAGINATION FOOTER */}
        {/* ============================================================== */}
        <div className="px-4 py-3 bg-mcc-halfwhite border-t border-mcc-maroon/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-serif">
          <div className="text-gray-600">
            Showing <span className="font-bold">{articles.length}</span> of{' '}
            <span className="font-bold">{totalCount}</span> dispatches
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors inline-flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="px-3 py-1 font-bold text-gray-800 font-sans">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors inline-flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. ARTICLE EDITOR MODAL */}
      {/* ============================================================== */}
      <ArticleEditorModal
        isOpen={isEditorOpen}
        article={selectedArticle}
        onClose={() => setIsEditorOpen(false)}
        onSaved={handleArticleSaved}
      />

      {/* ============================================================== */}
      {/* 6. DELETE CONFIRMATION MODAL */}
      {/* ============================================================== */}
      {deleteConfirmArticle && (
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
                  Confirm Dispatch Deletion
                </h3>
                <p className="text-xs text-gray-500 font-serif">
                  Permanent removal from broadsheet archive
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-700 font-serif leading-relaxed">
              Are you certain you wish to delete{' '}
              <span className="font-bold text-gray-900">
                "{deleteConfirmArticle.title}"
              </span>
              ? This action cannot be undone.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmArticle(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 border border-gray-300 text-xs font-serif font-semibold text-gray-700 hover:bg-gray-50 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-serif uppercase tracking-wider font-bold rounded shadow-sm inline-flex items-center gap-1.5"
              >
                {isDeleting ? 'Purging...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDITORIAL REVISION HISTORY MODAL (Task 87) */}
      <RevisionHistoryModal
        articleId={revisionModalArticle?.id}
        articleTitle={revisionModalArticle?.title}
        isOpen={Boolean(revisionModalArticle)}
        onClose={() => setRevisionModalArticle(null)}
      />
    </div>
  );
}
