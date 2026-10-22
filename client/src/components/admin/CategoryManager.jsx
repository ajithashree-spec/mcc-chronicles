import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FolderOpen,
  FileText,
  ExternalLink,
  X,
  Compass,
} from 'lucide-react';
import articleService from '../../services/articleService';

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await articleService.getCategories();
      const list = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
      setCategories(list);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError('Unable to load categories. Please check server connectivity.');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg, isErr = false) => {
    setNotification({ text: msg, isErr });
    setTimeout(() => setNotification(null), 4000);
  };

  // Helper to slugify
  const generateSlug = (text) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    // Auto-update slug if creating or if slug matches old generated slug
    if (!editingCategory) {
      setFormData((prev) => ({
        ...prev,
        name: val,
        slug: generateSlug(val),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        name: val,
      }));
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Category name is required.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    const payload = {
      name: formData.name.trim(),
      slug: (formData.slug || generateSlug(formData.name)).trim(),
      description: formData.description.trim() || null,
    };

    try {
      if (editingCategory) {
        await articleService.updateCategory(editingCategory.id, payload);
        showNotification(`Category "${payload.name}" updated successfully!`);
      } else {
        await articleService.createCategory(payload);
        showNotification(`Category "${payload.name}" created successfully!`);
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error('Save category failed:', err);
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to save category. Please ensure slug is unique.';
      setFormError(errMsg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (cat) => {
    setCategoryToDelete(cat);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setFormSubmitting(true);

    try {
      await articleService.deleteCategory(categoryToDelete.id);
      showNotification(`Category "${categoryToDelete.name}" deleted successfully.`);
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (err) {
      console.error('Delete category error:', err);
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Cannot delete category. Articles may be assigned to this section.';
      showNotification(errMsg, true);
      setIsDeleteModalOpen(false);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const q = searchQuery.toLowerCase();
      const matchName = cat.name?.toLowerCase().includes(q);
      const matchSlug = cat.slug?.toLowerCase().includes(q);
      const matchDesc = cat.description?.toLowerCase().includes(q);
      return matchName || matchSlug || matchDesc;
    });
  }, [categories, searchQuery]);

  const totalArticles = useMemo(() => {
    return categories.reduce(
      (sum, cat) => sum + (parseInt(cat.article_count, 10) || 0),
      0
    );
  }, [categories]);

  return (
    <div className="space-y-6">
      {/* 1. NOTIFICATION BANNER */}
      {notification && (
        <div
          className={`px-4 py-3 rounded-md text-sm font-sans flex items-center justify-between border ${
            notification.isErr
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          } animate-in fade-in duration-200`}
        >
          <div className="flex items-center gap-2">
            {notification.isErr ? (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
            <span>{notification.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-mcc-maroon" />
            <span>Broadsheet Desks & News Categories</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 font-sans mt-0.5">
            Configure dynamic front-page columns, section slugs, and editorial bureau taxonomies.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchCategories}
            className="px-3 py-2 text-xs font-sans font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
            title="Refresh category list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-3.5 py-2 text-xs font-sans font-bold text-white bg-mcc-maroon hover:bg-mcc-maroon-dark rounded flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Category</span>
          </button>
        </div>
      </div>

      {/* 3. METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-serif uppercase tracking-wider font-semibold">
              Total Categories
            </span>
            <Layers className="w-4 h-4 text-mcc-maroon" />
          </div>
          <div className="text-2xl font-serif font-bold text-gray-900">
            {categories.length}
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-sans">
            Active broadsheet editorial desks
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-serif uppercase tracking-wider font-semibold">
              Assigned Dispatches
            </span>
            <FileText className="w-4 h-4 text-mcc-navy" />
          </div>
          <div className="text-2xl font-serif font-bold text-gray-900">
            {totalArticles}
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-sans">
            Published stories mapped to columns
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-serif uppercase tracking-wider font-semibold">
              Broadsheet Sync
            </span>
            <Compass className="w-4 h-4 text-mcc-gold" />
          </div>
          <div className="text-sm font-serif font-bold text-emerald-700 flex items-center gap-1.5 pt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Dynamic Feed Enabled</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-2 font-sans">
            Front page columns rendered via API
          </p>
        </div>
      </div>

      {/* 4. SEARCH BAR */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search categories by name, slug, or scope..."
          className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded text-xs font-sans focus:outline-none focus:ring-1 focus:ring-mcc-maroon focus:border-mcc-maroon placeholder:text-gray-400 shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
          >
            Clear
          </button>
        )}
      </div>

      {/* 5. CATEGORIES TABLE */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-2xs overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-mcc-paper border-b border-gray-200 text-gray-700 uppercase tracking-wider font-sans text-[11px]">
              <tr>
                <th className="py-3 px-4 font-bold">Category & Desk</th>
                <th className="py-3 px-4 font-bold">Public URL Slug</th>
                <th className="py-3 px-4 font-bold">Editorial Scope</th>
                <th className="py-3 px-4 font-bold text-center">Stories</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-mcc-maroon" />
                    <span>Loading category desks from database...</span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-red-600">
                    <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-red-500" />
                    <span>{error}</span>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <FolderOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-serif font-bold text-sm text-gray-700">
                      No categories found
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {searchQuery
                        ? 'Try refining your search terms'
                        : 'Click "New Category" above to create your first broadsheet column'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-serif font-bold text-sm text-gray-900">
                        {cat.name}
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono">
                        ID: #{cat.id}
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="py-3.5 px-4 font-mono text-xs text-mcc-navy">
                      <div className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                        <span>/category/{cat.slug}</span>
                        <a
                          href={`/category/${cat.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-gray-400 hover:text-mcc-maroon ml-1"
                          title="View public category page"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4 text-gray-600 max-w-xs">
                      <p className="line-clamp-2 leading-relaxed">
                        {cat.description || (
                          <span className="italic text-gray-400">
                            No scope description specified.
                          </span>
                        )}
                      </p>
                    </td>

                    {/* Stories Count */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-mcc-maroon/10 text-mcc-maroon">
                        {cat.article_count || 0}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(cat)}
                          className="p-1.5 text-gray-500 hover:text-mcc-navy hover:bg-gray-100 rounded transition-colors"
                          title="Edit Category Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteModal(cat)}
                          className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Delete Category"
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

      {/* 6. CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-gray-200 overflow-hidden font-sans">
            <div className="bg-mcc-navy text-white px-5 py-4 flex items-center justify-between border-b-2 border-mcc-gold">
              <h3 className="font-serif font-bold text-base text-mcc-gold flex items-center gap-2">
                <Layers className="w-4 h-4 text-mcc-gold" />
                <span>
                  {editingCategory ? 'Edit Broadsheet Category' : 'Create New Category'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-800 text-xs rounded border border-red-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Category Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="e.g., Campus Spotlight"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-mcc-maroon focus:border-mcc-maroon"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  URL Slug <span className="text-red-600">*</span>
                </label>
                <div className="flex rounded border border-gray-300 overflow-hidden">
                  <span className="bg-gray-100 text-gray-500 px-2.5 py-2 text-xs font-mono border-r border-gray-300 select-none">
                    /category/
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        slug: generateSlug(e.target.value),
                      })
                    }
                    placeholder="campus-spotlight"
                    className="flex-1 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-mcc-maroon"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Unique broadsheet section URL key (lowercase, hyphens only).
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Editorial Scope & Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Summarize the journalistic scope covered under this category..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-mcc-maroon focus:border-mcc-maroon"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-mcc-maroon hover:bg-mcc-maroon-dark rounded transition-colors disabled:opacity-50"
                >
                  {formSubmitting
                    ? 'Saving...'
                    : editingCategory
                    ? 'Save Changes'
                    : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full border border-gray-200 p-5 font-sans space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-base text-gray-900">
                  Delete Category?
                </h4>
                <p className="text-xs text-gray-500">
                  Are you sure you want to delete &ldquo;{categoryToDelete.name}&rdquo;?
                </p>
              </div>
            </div>

            {categoryToDelete.article_count > 0 && (
              <div className="p-3 bg-amber-50 text-amber-900 text-xs rounded border border-amber-200">
                <strong>Warning:</strong> {categoryToDelete.article_count} dispatches are currently assigned to this category. Deleting it will disassociate these stories.
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={formSubmitting}
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50"
              >
                {formSubmitting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
