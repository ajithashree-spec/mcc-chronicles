import React, { useState, useEffect, useRef } from 'react';
import articleService from '../../services/articleService';
import { useAuth } from '../../context/AuthContext';
import ImageDropzone from '../common/ImageDropzone';
import { calculateReadingTime } from '../../utils/readingTime';
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
  Calendar,
  Trash2,
  User,
  Building2,
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
  const isEditorial = ['super_admin', 'superadmin', 'editor', 'admin'].includes(user?.role);

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [summary, setSummary] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('draft');
  const [scheduledAt, setScheduledAt] = useState('');
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
    let isMounted = true;
    if (isOpen) {
      if (article) {
        setTitle(article.title || '');
        setSlug(article.slug || slugify(article.title || ''));
        setAuthorName(article.author_name || article.author || user?.name || '');
        setSummary(article.summary || article.excerpt || '');
        setCategoryId(article.category_id || '');
        setDepartmentId(article.department_id ? String(article.department_id) : '');
        setCoverImage(article.cover_image || article.featured_image || '');
        setContent(article.content || '');
        setStatus(article.status || 'draft');
        setScheduledAt(
          article.scheduled_at
            ? new Date(new Date(article.scheduled_at).getTime() - new Date().getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16)
            : ''
        );
        setIsFeatured(Boolean(article.is_featured));
        setIsBreaking(Boolean(article.is_breaking));

        // Always fetch the complete article by ID to guarantee full body narrative is hydrated
        if (article.id) {
          const fetchPromise =
            typeof articleService.getArticle === 'function'
              ? articleService.getArticle(article.id)
              : typeof articleService.getArticleById === 'function'
              ? articleService.getArticleById(article.id)
              : typeof articleService.getArticleBySlug === 'function' && article.slug
              ? articleService.getArticleBySlug(article.slug)
              : null;

          if (fetchPromise) {
            fetchPromise
              .then((res) => {
                if (!isMounted) return;
                const full = res?.data || res;
                if (full) {
                  if (full.content !== undefined && full.content !== null) {
                    setContent(full.content);
                  }
                  if (full.title) setTitle(full.title);
                  if (full.summary) setSummary(full.summary);
                  if (full.status) setStatus(full.status);
                  if (full.category_id) setCategoryId(full.category_id);
                  if (full.department_id) setDepartmentId(String(full.department_id));
                  if (full.cover_image) setCoverImage(full.cover_image);
                }
              })
              .catch((err) => {
                console.warn('Could not fetch single article full body:', err);
              });
          }
        }
      } else {
        // Reset for new article
        setTitle('');
        setSlug('');
        setAuthorName(user?.name || 'MCC Bureau Correspondent');
        setSummary('');
        setCategoryId('');
        setDepartmentId(user?.department_id ? String(user.department_id) : '');
        setCoverImage('');
        setContent('');
        setStatus(isEditorial ? 'published' : 'draft');
        setScheduledAt('');
        setIsFeatured(false);
        setIsBreaking(false);
      }
      setError(null);
      setSuccessMessage(null);
      setImagePreviewError(false);
    }
    return () => {
      isMounted = false;
    };
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

  // Word count & dynamic reading time calculation (Task 93)
  const readingStats = calculateReadingTime(content);
  const wordCount = readingStats.words;
  const readingTimeText = readingStats.text;

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
  const handleSubmit = async (e, overrideStatus = null) => {
    if (e && e.preventDefault) e.preventDefault();
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
      setError('Please select a broadsheet section / category for this dispatch.');
      return;
    }

    const targetStatus = overrideStatus || status || (isEditorial ? 'published' : 'draft');

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        summary: summary.trim() || null,
        excerpt: summary.trim() || null,
        author_name: authorName.trim() || user?.name || 'MCC Bureau Correspondent',
        category_id: parseInt(categoryId, 10),
        department_id: parseInt(departmentId, 10),
        cover_image: coverImage.trim() || null,
        content: content.trim(),
        status: targetStatus,
        scheduled_at: targetStatus === 'scheduled' && scheduledAt ? new Date(scheduledAt).toISOString() : null,
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

  // Immediate Delete with confirmation dialog
  const handleDelete = async () => {
    if (!article || !article.id) return;
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete dispatch "${article.title}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setSubmitting(true);
      await articleService.deleteArticle(article.id);
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to delete article dispatch.');
    } finally {
      setSubmitting(false);
    }
  };

  // Group departments by stream for broadsheet bureau selector
  const aidedDepartments = departments.filter((d) => d.stream === 'Aided');
  const sfsDepartments = departments.filter(
    (d) => d.stream === 'Self-Financed' || d.stream === 'SFS'
  );
  const otherDepartments = departments.filter(
    (d) => d.stream !== 'Aided' && d.stream !== 'Self-Financed' && d.stream !== 'SFS'
  );

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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-800">
                  Target Department Bureau
                </label>
                <span className="text-[10px] font-serif text-[#C5A059] font-bold">
                  38 Official Desks
                </span>
              </div>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-serif border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-none bg-white font-medium"
              >
                <option value="">ALL DEPARTMENTS</option>
                <optgroup label="Aided Stream (Shift I) - 17 Departments">
                  {aidedDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Self-Financed Stream (Shift II) - 21 Departments">
                  {sfsDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </optgroup>
                {otherDepartments.length > 0 && (
                  <optgroup label="Other Campus Desks">
                    {otherDepartments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          </div>

          {/* Author / Byline Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-800">
                Author Byline / Desk Correspondent
              </label>
              <span className="text-[10px] text-gray-500 font-serif">
                Public Broadsheet Byline
              </span>
            </div>
            <div className="relative rounded-md shadow-2xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User className="w-3.5 h-3.5 text-[#C5A059]" />
              </div>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Dr. K. Senthil Kumar / Bureau Editorial Board"
                className="w-full pl-9 pr-3 py-2 text-xs font-serif border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-none bg-white"
              />
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
              {/* Telemetry: Word Count & Reading Time (Task 93) */}
              <div className="flex items-center gap-3 text-xs text-gray-500 font-serif">
                <span className="inline-flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-mcc-maroon" />
                  <span>{wordCount} words</span>
                </span>
                <span>&bull;</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-mcc-gold" />
                  <span>{readingTimeText}</span>
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

          {/* 6. Publishing Status & Editorial Flags (Task 94) */}
          <div className="bg-mcc-halfwhite border border-mcc-maroon/20 p-4 rounded-md space-y-4">
            <h4 className="text-xs font-serif uppercase tracking-wider font-bold text-gray-900">
              Publishing Directives & Broadsheet Placement
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-serif font-bold text-gray-700 mb-1">
                  Editorial Lifecycle Status
                </label>
                <select
                  value={status === 'published' ? 'published' : 'draft'}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-serif border border-gray-300 rounded focus:border-mcc-maroon outline-none bg-white font-semibold"
                >
                  <option value="published">Published (Live Public Broadsheet)</option>
                  <option value="draft">Draft in Progress</option>
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 text-xs font-serif font-semibold text-gray-700 hover:bg-gray-50 rounded transition-colors"
            >
              Cancel
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="px-3.5 py-2 border border-red-300 text-xs font-serif font-bold text-red-700 hover:bg-red-50 rounded transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                title="Delete this dispatch permanently"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Dispatch</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                setStatus('draft');
                handleSubmit(e, 'draft');
              }}
              disabled={submitting}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-serif font-bold text-gray-800 rounded transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 inline mr-1 text-gray-600" />
              <span>Save as Draft</span>
            </button>

            <button
              type="button"
              onClick={(e) => handleSubmit(e, status || (isEditorial ? 'published' : 'draft'))}
              disabled={submitting}
              className="px-5 py-2 bg-mcc-maroon hover:bg-mcc-maroon-dark text-white text-xs font-serif uppercase tracking-wider font-bold rounded transition-colors shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-mcc-gold" />
              <span>
                {submitting
                  ? 'Committing...'
                  : isEditing
                  ? status === 'published'
                    ? 'Update & Publish'
                    : 'Update Dispatch'
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
