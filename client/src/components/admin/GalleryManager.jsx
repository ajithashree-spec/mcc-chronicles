import React, { useState, useEffect } from 'react';
import articleService from '../../services/articleService';
import { useAuth } from '../../context/AuthContext';
import ImageDropzone from '../common/ImageDropzone';
import {
  Image as ImageIcon,
  PlusCircle,
  Search,
  Filter,
  Edit3,
  Trash2,
  Sparkles,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Star,
  X,
  Send,
  Camera,
  Calendar,
  Tag,
} from 'lucide-react';

export default function GalleryManager() {
  const { user } = useAuth();
  const isEditorial = ['super_admin', 'editor'].includes(user?.role);

  // Listing states
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Filters
  const [eventFilter, setEventFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Department references
  const [departments, setDepartments] = useState([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  const [eventName, setEventName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [isFeaturedCarousel, setIsFeaturedCarousel] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  // Delete confirm
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
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
        console.error('Failed to load departments:', err);
      }
    }
    loadDepartments();
  }, []);

  // Fetch gallery items
  const fetchGallery = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        limit: 50,
      };
      if (eventFilter.trim()) {
        params.event_name = eventFilter.trim();
      }

      const res = await articleService.getGalleries(params);
      if (res && res.data) {
        let fetched = res.data;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          fetched = fetched.filter(
            (i) =>
              (i.title && i.title.toLowerCase().includes(q)) ||
              (i.caption && i.caption.toLowerCase().includes(q)) ||
              (i.event_name && i.event_name.toLowerCase().includes(q))
          );
        }
        setItems(fetched);
      }
    } catch (err) {
      console.error('Failed to load gallery items:', err);
      setError('Unable to load pictorial archive items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, [eventFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchGallery();
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingItem(null);
    setTitle('');
    setImageUrl('');
    setCaption('');
    setDescription('');
    setEventName('');
    setDepartmentId(user?.department_id || '');
    setIsFeaturedCarousel(false);
    setPreviewError(false);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setTitle(item.title || '');
    setImageUrl(item.image_url || '');
    setCaption(item.caption || '');
    setDescription(item.description || '');
    setEventName(item.event_name || '');
    setDepartmentId(item.department_id || '');
    setIsFeaturedCarousel(Boolean(item.is_featured_carousel));
    setPreviewError(false);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Quick toggle featured carousel flag
  const handleToggleCarousel = async (item) => {
    const nextVal = !item.is_featured_carousel;
    try {
      await articleService.updateGalleryItem(item.id, {
        is_featured_carousel: nextVal,
      });
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, is_featured_carousel: nextVal } : i
        )
      );
      setNotification(
        nextVal
          ? `Asset added to front-page banner carousel.`
          : `Asset removed from banner carousel.`
      );
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Failed to toggle carousel flag:', err);
      alert('Could not update carousel flag: ' + (err.response?.data?.message || err.message));
    }
  };

  // Save Create or Edit
  const handleSaveItem = async (e) => {
    e.preventDefault();
    setModalError(null);

    if (!title.trim()) {
      setModalError('Media asset title is required.');
      return;
    }
    if (!imageUrl.trim()) {
      setModalError('Valid image URL is required.');
      return;
    }

    try {
      setModalSubmitting(true);
      const payload = {
        title: title.trim(),
        image_url: imageUrl.trim(),
        caption: caption.trim() || null,
        description: description.trim() || null,
        event_name: eventName.trim() || null,
        department_id: departmentId ? parseInt(departmentId, 10) : null,
        is_featured_carousel: isFeaturedCarousel,
      };

      if (editingItem) {
        await articleService.updateGalleryItem(editingItem.id, payload);
        setNotification('Gallery asset updated successfully.');
      } else {
        await articleService.createGalleryItem(payload);
        setNotification('New pictorial asset cataloged successfully.');
      }

      setIsModalOpen(false);
      fetchGallery();
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Failed to save gallery asset:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Error saving gallery asset.';
      setModalError(msg);
    } finally {
      setModalSubmitting(false);
    }
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deleteConfirmItem) return;
    try {
      setIsDeleting(true);
      await articleService.deleteGalleryItem(deleteConfirmItem.id);
      setItems((prev) => prev.filter((i) => i.id !== deleteConfirmItem.id));
      setDeleteConfirmItem(null);
      setNotification('Asset successfully expunged from pictorial archive.');
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Failed to delete asset:', err);
      alert('Delete failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsDeleting(false);
    }
  };

  // Unique list of event tags for quick filtering
  const existingEvents = Array.from(
    new Set(items.map((i) => i.event_name).filter(Boolean))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ============================================================== */}
      {/* 1. HEADER & ACTIONS */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-mcc-maroon pb-4">
        <div>
          <span className="text-[11px] font-serif uppercase tracking-widest text-mcc-gold font-bold">
            Visual Journalism
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-gray-900 tracking-tight">
            Campus Pictorial & Media Asset Desk
          </h1>
          <p className="text-xs text-gray-600 font-serif mt-0.5">
            Curate high-resolution campus photography, convocation archives, and front-page carousels.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-mcc-maroon hover:bg-mcc-maroon-dark text-white text-xs font-serif uppercase tracking-wider font-bold rounded shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4 text-mcc-gold" />
          <span>Upload Media Asset</span>
        </button>
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
            onClick={fetchGallery}
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
        {/* Event Quick Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs font-serif font-semibold">
          <button
            type="button"
            onClick={() => setEventFilter('')}
            className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
              eventFilter === ''
                ? 'bg-mcc-navy text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Photo Assets
          </button>
          {existingEvents.map((evt) => (
            <button
              key={evt}
              type="button"
              onClick={() => setEventFilter(evt)}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                eventFilter === evt
                  ? 'bg-mcc-navy text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {evt}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search captions & titles..."
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
            onClick={fetchGallery}
            title="Refresh Gallery"
            className="p-1.5 text-gray-500 hover:text-mcc-maroon hover:bg-gray-100 rounded border border-gray-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </form>
      </div>

      {/* ============================================================== */}
      {/* 3. MEDIA ASSET GRID */}
      {/* ============================================================== */}
      {loading && items.length === 0 ? (
        <div className="bg-white border border-mcc-maroon/20 p-12 text-center text-gray-500 font-serif rounded">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-mcc-maroon mb-2" />
          <span>Cataloging pictorial assets...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-mcc-maroon/20 p-12 text-center text-gray-500 font-serif rounded">
          <ImageIcon className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="font-bold text-gray-800">No media assets found</p>
          <p className="text-xs text-gray-500 mt-1">
            Upload new campus photography to populate the archive.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((item) => {
            return (
              <div
                key={item.id}
                className="bg-white border border-mcc-maroon/20 rounded shadow-xs overflow-hidden flex flex-col group hover:shadow-md transition-shadow"
              >
                {/* Thumbnail Image */}
                <div className="relative aspect-4/3 bg-gray-100 overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = '/images/mcc-campus-hero.jpg';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Carousel Ribbon */}
                  {item.is_featured_carousel ? (
                    <div className="absolute top-2 left-2 bg-mcc-gold text-mcc-navy px-2 py-0.5 rounded text-[10px] font-serif uppercase tracking-wider font-black flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 fill-mcc-navy" />
                      <span>Banner Carousel</span>
                    </div>
                  ) : null}

                  {/* Event Tag */}
                  {item.event_name && (
                    <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white px-2 py-0.5 rounded text-[10px] font-sans font-medium flex items-center gap-1">
                      <Tag className="w-3 h-3 text-mcc-gold" />
                      <span>{item.event_name}</span>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="font-serif font-bold text-sm text-gray-900 line-clamp-1 group-hover:text-mcc-maroon transition-colors">
                      {item.title}
                    </h3>
                    {item.caption && (
                      <p className="text-xs text-gray-600 font-serif line-clamp-2 mt-1 leading-snug">
                        {item.caption}
                      </p>
                    )}
                  </div>

                  {/* Metadata and Controls */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    {/* Carousel toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleCarousel(item)}
                      title={
                        item.is_featured_carousel
                          ? 'Remove from Banner Carousel'
                          : 'Feature on Banner Carousel'
                      }
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-serif font-semibold transition-colors ${
                        item.is_featured_carousel
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Star
                        className={`w-3 h-3 ${
                          item.is_featured_carousel ? 'fill-amber-600 text-amber-600' : ''
                        }`}
                      />
                      <span>{item.is_featured_carousel ? 'Featured' : 'Feature'}</span>
                    </button>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        title="Edit Metadata"
                        className="p-1 text-mcc-maroon hover:bg-mcc-maroon/10 rounded transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {isEditorial && (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmItem(item)}
                          title="Delete Photo"
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. UPLOAD / EDIT PHOTO MODAL */}
      {/* ============================================================== */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-lg shadow-2xl border-t-4 border-mcc-maroon border-x border-b border-mcc-maroon/20 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden text-gray-900">
            {/* Header */}
            <div className="px-6 py-4 border-b border-mcc-maroon/15 flex items-center justify-between bg-mcc-halfwhite">
              <div>
                <span className="text-[10px] font-serif uppercase tracking-widest text-mcc-gold font-bold">
                  Pictorial Archive
                </span>
                <h2 className="text-xl font-serif font-black text-gray-900">
                  {editingItem ? `Edit Asset #${editingItem.id}` : 'Upload Media Asset'}
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

            {/* Error Banner */}
            {modalError && (
              <div className="mx-6 mt-4 p-3 rounded bg-red-50 border-l-4 border-red-700 text-red-800 text-xs font-serif flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveItem} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-800 mb-1">
                  Asset Title <span className="text-red-700">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Heber Hall Sunrise & Historic Banyan"
                  className="w-full px-3.5 py-2 text-sm font-serif font-bold border border-gray-300 rounded focus:border-mcc-maroon outline-none"
                />
              </div>

              {/* Image Asset Dropzone (Task 88) */}
              <ImageDropzone
                value={imageUrl}
                onChange={(url) => {
                  setImageUrl(url);
                  setPreviewError(false);
                }}
                label="High-Resolution Image Asset"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-800 mb-1">
                    Event Tag / Collection
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g. DeepWoods 2026, Convocation"
                    className="w-full px-3 py-2 text-xs font-serif border border-gray-300 rounded focus:border-mcc-maroon outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-800 mb-1">
                    Department
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-serif border border-gray-300 rounded focus:border-mcc-maroon outline-none bg-white"
                  >
                    <option value="">-- General Campus Heritage --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-800 mb-1">
                  Editorial Caption / Attribution
                </label>
                <textarea
                  rows={2}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Photo by Staff Reporter &bull; Captured at Anderson Hall Quadrangle..."
                  className="w-full px-3 py-2 text-xs font-serif border border-gray-300 rounded focus:border-mcc-maroon outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-800 mb-1">
                  Archival Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Historical context, camera specs, or background details..."
                  className="w-full px-3 py-2 text-xs font-sans border border-gray-300 rounded focus:border-mcc-maroon outline-none"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer bg-mcc-halfwhite border border-mcc-maroon/20 p-3 rounded">
                  <input
                    type="checkbox"
                    checked={isFeaturedCarousel}
                    onChange={(e) => setIsFeaturedCarousel(e.target.checked)}
                    className="w-4 h-4 text-mcc-maroon rounded border-gray-300 focus:ring-mcc-maroon"
                  />
                  <div>
                    <span className="text-xs font-serif font-bold text-gray-900 block">
                      Feature on Homepage Banner Carousel
                    </span>
                    <span className="text-[11px] text-gray-500 font-sans">
                      Promotes this high-resolution photo to the revolving hero banner on the broadsheet front page.
                    </span>
                  </div>
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
                      ? 'Cataloging...'
                      : editingItem
                      ? 'Update Asset'
                      : 'Upload & Catalog'}
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
      {deleteConfirmItem && (
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
                  Delete Pictorial Asset
                </h3>
                <p className="text-xs text-gray-500 font-serif">
                  Permanent removal from media repository
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-700 font-serif leading-relaxed">
              Are you certain you wish to purge{' '}
              <span className="font-bold text-gray-900">
                "{deleteConfirmItem.title}"
              </span>
              ?
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
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
    </div>
  );
}
