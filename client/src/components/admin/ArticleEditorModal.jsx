import React, { useState, useEffect, useRef } from 'react';
import articleService from '../../services/articleService';
import { useAuth } from '../../context/AuthContext';
import ImageDropzone from '../common/ImageDropzone';
import {
  X,
  Save,
  Send,
  Image as ImageIcon,
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  List,
  Minus,
  Sparkles,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function ArticleEditorModal({
  isOpen,
  onClose,
  article = null, // null for create, object for edit
  onSaved,
}) {
  const { user } = useAuth();
  const textareaRef = useRef(null);

  const isEditing = Boolean(article && article.id);
  const isEditorial = ['super_admin', 'editor'].includes(user?.role);

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('draft');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);

  // Reference data
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingRefData, setLoadingRefData] = useState(true);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [imagePreviewError, setImagePreviewError] = useState(false);

  // Populate data when modal opens or article changes
  useEffect(() => {
    if (isOpen) {
      if (article) {
        setTitle(article.title || '');
        setSlug(article.slug || slugify(article.title || ''));
        setSummary(article.summary || article.excerpt || '');
        setCategoryId(article.category_id || '');
        setDepartmentId(article.department_id || '');
        setCoverImage(article.cover_image || article.featured_image || '');
        setContent(article.content || '');
        setStatus(article.status || 'draft');
        setIsFeatured(Boolean(article.is_featured));
        setIsBreaking(Boolean(article.is_breaking));
      } else {
        // Reset for new article
        setTitle('');
        setSlug('');
        setSummary('');
        setCategoryId('');
        setDepartmentId(user?.department_id || '');
        setCoverImage('');
        setContent('');
        setStatus(isEditorial ? 'published' : 'draft');
        setIsFeatured(false);
        setIsBreaking(false);
      }
      setError(null);
      setSuccessMessage(null);
      setImagePreviewError(false);
    }
  }, [isOpen, article, user, isEditorial]);

  // Load categories and departments
  useEffect(() => {
    let isMounted = true;
    async function loadMeta() {
      try {
        const [catRes, deptRes] = await Promise.all([
          articleService.getCategories(),
          articleService.getDepartments(),
        ]);
        if (isMounted) {
          if (catRes?.data) setCategories(catRes.data);
          if (deptRes?.data) setDepartments(deptRes.data);
        }
      } catch (err) {
        console.error('Failed to load categories or departments:', err);
      } finally {
        if (isMounted) setLoadingRefData(false);
      }
    }
    if (isOpen) {
      loadMeta();
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Update slug automatically when title changes if creating or if slug matches old title
  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    if (!isEditing || slug === slugify(title)) {
      setSlug(slugify(val));
    }
  };

  // Word count & reading time
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Markdown formatting helpers
  const insertFormatting = (prefix, suffix = '', placeholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || placeholder;

    const newContent =
      content.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      content.substring(end);

    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 0);
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!title.trim()) {
      setError('Article headline/title is required.');
      return;
    }
    if (!content.trim()) {
      setError('Article content body is required.');
      return;
    }
    if (!categoryId) {
      setError('Please select a category for this dispatch.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        summary: summary.trim() || null,
        excerpt: summary.trim() || null,
        category_id: parseInt(categoryId, 10),
        department_id: departmentId ? parseInt(departmentId, 10) : null,
        cover_image: coverImage.trim() || null,
        content: content.trim(),
        status,
        is_featured: isFeatured,
        is_breaking: isBreaking,
      };

      let result;
      if (isEditing) {
        result = await articleService.updateArticle(article.id, payload);
      } else {
        result = await articleService.createArticle(payload);
      }

      setSuccessMessage(
        isEditing
          ? 'Article updated successfully!'
          : 'New dispatch published/saved successfully!'
      );

      setTimeout(() => {
        if (onSaved) onSaved(result?.data || payload);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to save article:', err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Error saving article dispatch. Please verify required fields.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-modal-title"
    >
      <div className="bg-white rounded-lg shadow-2xl border-t-4 border-mcc-maroon border-x border-b border-mcc-maroon/20 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-gray-900">
        {/* ============================================================== */}
        {/* MODAL HEADER */}
        {/* ============================================================== */}
        <div className="px-6 py-4 border-b border-mcc-maroon/15 flex items-center justify-between bg-mcc-halfwhite">
          <div>
            <span className="text-[10px] font-serif uppercase tracking-widest text-mcc-gold font-bold">
              Editorial Desk Dispatch Studio
            </span>
            <h2 id="article-modal-title" className="text-xl font-serif font-black text-gray-900">
              {isEditing ? `Edit Dispatch #${article.id}` : 'Compose New Broadsheet Dispatch'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FEEDBACK BANNERS */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded bg-red-50 border-l-4 border-red-700 text-red-800 text-xs font-serif flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded bg-emerald-50 border-l-4 border-emerald-700 text-emerald-800 text-xs font-serif flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCROLLABLE FORM BODY */}
        {/* ============================================================== */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Title & URL Slug */}
          <div className="space-y-2">
            <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-800">
              Headline / Title <span className="text-red-700">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={handleTitleChange}
              placeholder="e.g. 188th MCC Convocation Celebrates Historic Milestone and Academic Laurels"
              className="w-full px-3.5 py-2.5 text-base sm:text-lg font-serif font-bold border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-none"
            />
            {slug && (
              <div className="text-[11px] font-mono text-gray-500 truncate flex items-center gap-1">
                <span className="text-gray-400">Canonical Slug:</span>
                <span className="text-mcc-maroon font-semibold">/article/{slug}</span>
              </div>
            )}
          </div>

          {/* 2. Subheadline / Deck Excerpt */}
          <div className="space-y-1.5">
            <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-800">
              Deck / Subheadline Excerpt
            </label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="A concise, editorial teaser summarizing the dispatch for front-page columns..."
              className="w-full px-3 py-2 text-xs sm:text-sm font-serif border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-none"
            />
          </div>

          {/* 3. Category & Department Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-800 mb-1">
                Broadsheet Section / Category <span className="text-red-700">*</span>
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-serif border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-none bg-white"
              >
                <option value="">-- Select Broadsheet Category --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.slug})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-800 mb-1">
                Associated Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-serif border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-none bg-white"
              >
                <option value="">-- Institutional / General Campus --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Cover Image Asset Dropzone (Task 88) */}
          <ImageDropzone
            value={coverImage}
            onChange={(url) => {
              setCoverImage(url);
              setImagePreviewError(false);
            }}
            label="Cover Image Asset"
          />

          {/* 5. Editorial Content Area with Markdown Toolbar Helpers */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-800">
                Editorial Dispatch Body <span className="text-red-700">*</span>
              </label>
              {/* Telemetry: Word Count & Reading Time */}
              <div className="flex items-center gap-3 text-xs text-gray-500 font-serif">
                <span className="inline-flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-mcc-maroon" />
                  <span>{wordCount} words</span>
                </span>
                <span>&bull;</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-mcc-gold" />
                  <span>~{readingTimeMinutes} min read</span>
                </span>
              </div>
            </div>

            {/* Markdown Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-1.5 bg-gray-100 border border-gray-300 rounded-t text-gray-700 text-xs">
              <button
                type="button"
                onClick={() => insertFormatting('**', '**', 'bold text')}
                className="p-1 hover:bg-gray-200 rounded"
                title="Bold (**text**)"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('*', '*', 'italic text')}
                className="p-1 hover:bg-gray-200 rounded"
                title="Italic (*text*)"
              >
                <Italic className="w-4 h-4" />
              </button>
              <span className="w-px h-4 bg-gray-300 mx-1" />
              <button
                type="button"
                onClick={() => insertFormatting('\n## ', '\n', 'Section Headline')}
                className="p-1 hover:bg-gray-200 rounded"
                title="Heading 2 (## Headline)"
              >
                <Heading2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('\n### ', '\n', 'Subheading')}
                className="p-1 hover:bg-gray-200 rounded"
                title="Heading 3 (### Subheading)"
              >
                <Heading3 className="w-4 h-4" />
              </button>
              <span className="w-px h-4 bg-gray-300 mx-1" />
              <button
                type="button"
                onClick={() => insertFormatting('\n> ', '\n', 'Editorial pull-quote text...')}
                className="p-1 hover:bg-gray-200 rounded"
                title="Blockquote (> Quote)"
              >
                <Quote className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('\n- ', '', 'List item')}
                className="p-1 hover:bg-gray-200 rounded"
                title="Bullet List (- item)"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('\n\n---\n\n', '', '')}
                className="p-1 hover:bg-gray-200 rounded"
                title="Horizontal Rule (---)"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-px h-4 bg-gray-300 mx-1" />
              <button
                type="button"
                onClick={() =>
                  insertFormatting(
                    '<p class="editorial-drop-cap">',
                    '</p>',
                    'Initial paragraph with broadsheet drop-cap styling'
                  )
                }
                className="px-2 py-0.5 hover:bg-gray-200 rounded font-serif font-bold text-[11px] text-mcc-maroon"
                title="Insert Drop-Cap Paragraph"
              >
                Drop-Cap
              </button>
            </div>

            <textarea
              ref={textareaRef}
              required
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Draft the article narrative in Markdown or clean paragraphs..."
              className="w-full px-3.5 py-3 text-sm font-sans leading-relaxed border border-gray-300 rounded-b focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-none font-mono"
            />
          </div>

          {/* 6. Publishing Status & Editorial Flags */}
          <div className="bg-mcc-halfwhite border border-mcc-maroon/20 p-4 rounded-md space-y-4">
            <h4 className="text-xs font-serif uppercase tracking-wider font-bold text-gray-900">
              Publishing Directives & Broadsheet Placement
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-serif font-bold text-gray-700 mb-1">
                  Lifecycle Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-serif border border-gray-300 rounded focus:border-mcc-maroon outline-none bg-white font-semibold"
                >
                  <option value="draft">Draft (Saved Locally)</option>
                  <option value="under_review">Submit for Review</option>
                  {isEditorial && (
                    <option value="published">Published (Live Public Broadsheet)</option>
                  )}
                  {isEditorial && (
                    <option value="archived">Archived (Withdrawn)</option>
                  )}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="chk-featured"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 text-mcc-maroon rounded border-gray-300 focus:ring-mcc-maroon"
                />
                <label htmlFor="chk-featured" className="text-xs font-serif font-bold text-gray-800 cursor-pointer">
                  Featured Front-Page Story
                </label>
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="chk-breaking"
                  checked={isBreaking}
                  onChange={(e) => setIsBreaking(e.target.checked)}
                  className="w-4 h-4 text-mcc-maroon rounded border-gray-300 focus:ring-mcc-maroon"
                />
                <label htmlFor="chk-breaking" className="text-xs font-serif font-bold text-red-900 cursor-pointer">
                  Breaking News Banner
                </label>
              </div>
            </div>
          </div>
        </form>

        {/* ============================================================== */}
        {/* MODAL FOOTER */}
        {/* ============================================================== */}
        <div className="px-6 py-4 border-t border-mcc-maroon/15 bg-white flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 border border-gray-300 text-xs font-serif font-semibold text-gray-700 hover:bg-gray-50 rounded transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                setStatus('draft');
                handleSubmit(e);
              }}
              disabled={submitting}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-serif font-bold text-gray-800 rounded transition-colors"
            >
              <Save className="w-3.5 h-3.5 inline mr-1 text-gray-600" />
              <span>Save as Draft</span>
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2 bg-mcc-maroon hover:bg-mcc-maroon-dark text-white text-xs font-serif uppercase tracking-wider font-bold rounded transition-colors shadow-sm inline-flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5 text-mcc-gold" />
              <span>
                {submitting
                  ? 'Committing...'
                  : isEditing
                  ? 'Update Dispatch'
                  : status === 'published'
                  ? 'Publish Broadsheet'
                  : 'Submit Dispatch'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
