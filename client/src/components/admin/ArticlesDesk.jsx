import React, { useState, useEffect } from 'react';
import articleService from '../../services/articleService';
import ArticleEditorModal from './ArticleEditorModal';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  FileText,
  Calendar,
  Building2,
  AlertCircle,
} from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return 'Unpublished';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Recent';
  }
}

export default function ArticlesDesk({ onComposeArticle }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Fetch all articles
  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await articleService.getArticles({
        limit: 50,
        status: 'all',
      });
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : [];
      setArticles(list);
    } catch (err) {
      console.error('Failed to load articles:', err);
      setError('Unable to retrieve article dispatches. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // Open editor for new article
  const handleCreateNew = () => {
    if (onComposeArticle) {
      onComposeArticle();
    } else {
      setSelectedArticle(null);
      setIsEditorOpen(true);
    }
  };

  // Open editor for existing article
  const handleEdit = (article) => {
    setSelectedArticle(article);
    setIsEditorOpen(true);
  };

  // Delete article with confirmation prompt
  const handleDelete = async (article) => {
    if (!article || !article.id) return;
    const confirmed = window.confirm('Are you sure you want to delete this dispatch?');
    if (!confirmed) return;

    try {
      setLoading(true);
      await articleService.deleteArticle(article.id);
      await fetchArticles();
    } catch (err) {
      console.error('Delete failed:', err);
      alert(err.response?.data?.error || err.message || 'Failed to delete dispatch.');
    } finally {
      setLoading(false);
    }
  };

  // Filter articles by search query
  const filteredArticles = articles.filter((art) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const titleMatch = (art.title || '').toLowerCase().includes(q);
    const summaryMatch = (art.summary || '').toLowerCase().includes(q);
    const deptMatch = (art.department_name || '').toLowerCase().includes(q);
    return titleMatch || summaryMatch || deptMatch;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. TOP ACTION BAR */}
      <div className="bg-white border border-[#C5A059]/30 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Search input field */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dispatches by title or bureau..."
            className="w-full pl-9 pr-3 py-2 text-xs font-serif border border-gray-300 rounded focus:border-[#7B1113] focus:ring-1 focus:ring-[#7B1113] outline-none bg-white placeholder-gray-400"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>

        {/* Right: Prominent Compose Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchArticles}
            title="Refresh list"
            className="p-2 text-gray-600 hover:text-[#7B1113] hover:bg-gray-100 rounded border border-gray-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleCreateNew}
            className="px-5 py-2.5 bg-[#7B1113] hover:bg-[#5C0D0E] text-white text-xs font-serif uppercase tracking-wider font-bold rounded shadow-sm transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#C5A059]" />
            <span>+ COMPOSE NEW DISPATCH</span>
          </button>
        </div>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="p-3.5 rounded bg-red-50 border-l-4 border-red-700 text-red-900 text-xs font-serif flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchArticles}
            className="underline font-bold text-xs cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. DIRECT CRUD TABLE */}
      <div className="bg-white border border-[#C5A059]/30 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#C5A059]/30 text-gray-800 font-serif font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Title</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Published Date</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-serif">
              {loading && articles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#7B1113] mb-2" />
                    <span>Loading dispatches...</span>
                  </td>
                </tr>
              ) : filteredArticles.length === 0 ? (
                /* 3. Empty State */
                <tr>
                  <td colSpan={5} className="py-12 px-4 text-center text-gray-600">
                    <FileText className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="font-bold text-sm text-gray-800">
                      No dispatches authored yet. Click 'Compose New Dispatch' to publish one.
                    </p>
                    {searchQuery && (
                      <p className="text-xs text-gray-500 mt-1">
                        No articles matched query "{searchQuery}".
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredArticles.map((article) => {
                  const deptDisplay =
                    article.department_name
                      ? article.department_name.replace('Department of ', '')
                      : article.department_code || 'General Campus';

                  const dateDisplay = formatDate(article.published_at || article.created_at);
                  const isPublished = article.status === 'published';

                  return (
                    <tr
                      key={article.id}
                      className="hover:bg-[#FAF8F5] transition-colors group"
                    >
                      {/* 1. Title (headline & excerpt snippet) */}
                      <td className="py-3.5 px-4 max-w-sm sm:max-w-md">
                        <div className="font-bold text-sm text-gray-900 group-hover:text-[#7B1113] transition-colors line-clamp-1 leading-snug">
                          {article.title}
                        </div>
                        {article.summary && (
                          <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5 font-normal">
                            {article.summary}
                          </p>
                        )}
                      </td>

                      {/* 2. Department */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-800 text-xs">
                          {deptDisplay}
                        </span>
                      </td>

                      {/* 3. Published Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-gray-600 text-[11px]">
                        {dateDisplay}
                      </td>

                      {/* 4. Status Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase tracking-wider ${
                            isPublished
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>

                      {/* 5. Actions: Edit and Delete */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(article)}
                            className="p-1.5 px-2.5 text-[#7B1113] hover:bg-[#7B1113]/10 border border-[#7B1113]/30 rounded transition-colors inline-flex items-center gap-1 text-xs font-bold cursor-pointer"
                            title="Edit Dispatch"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(article)}
                            className="p-1.5 px-2.5 text-red-700 hover:bg-red-50 border border-red-300 rounded transition-colors inline-flex items-center gap-1 text-xs font-bold cursor-pointer"
                            title="Delete Dispatch"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
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

      {/* ARTICLE EDITOR MODAL */}
      <ArticleEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        article={selectedArticle}
        onSaved={() => {
          setIsEditorOpen(false);
          fetchArticles();
        }}
      />
    </div>
  );
}
