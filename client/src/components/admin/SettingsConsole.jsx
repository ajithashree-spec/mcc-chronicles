import React, { useState, useEffect, useRef } from 'react';
import articleService from '../../services/articleService';
import { useAuth } from '../../context/AuthContext';
import { usePageSettings, DEFAULT_PAGE_SETTINGS } from '../../context/PageSettingsContext';
import { Link } from 'react-router-dom';
import {
  Sliders,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Bell,
  Image as ImageIcon,
  BookOpen,
  ShieldCheck,
  ExternalLink,
  Mail,
  MapPin,
  Sparkles,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  Layers,
  Phone,
  Award,
  Globe,
  Edit3,
  X,
  Calendar,
} from 'lucide-react';

export default function SettingsConsole() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'super_admin';
  const { settings, refreshSettings, updateSettingsBulk } = usePageSettings();

  // Active top tab
  const [activeTab, setActiveTab] = useState('masthead'); // 'masthead' | 'ticker' | 'slideshow' | 'frontpage' | 'departments' | 'footer'

  // Local editable form state initialized from context
  const [formData, setFormData] = useState({ ...DEFAULT_PAGE_SETTINGS });
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Articles & Departments for dropdown pickers
  const [articlesList, setArticlesList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [deptFilterStream, setDeptFilterStream] = useState('All');
  const [deptSearch, setDeptSearch] = useState('');
  const [editingDept, setEditingDept] = useState(null);
  const [deptSaveLoading, setDeptSaveLoading] = useState(false);

  // Status indicators
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // New Ticker Item modal/inline state
  const [newTickerText, setNewTickerText] = useState('');
  const [newTickerCategory, setNewTickerCategory] = useState('Gazette');
  const [newTickerLink, setNewTickerLink] = useState('/circulars');

  // File input ref for hero slide upload
  const fileInputRef = useRef(null);
  const [uploadTargetSlideIndex, setUploadTargetSlideIndex] = useState(null);

  // Sync settings when loaded
  useEffect(() => {
    if (settings) {
      setFormData({
        ...DEFAULT_PAGE_SETTINGS,
        ...settings,
      });
      setInitialLoaded(true);
    }
  }, [settings]);

  // Fetch articles and departments for selectors
  useEffect(() => {
    let isMounted = true;
    const fetchSelectableData = async () => {
      try {
        setLoading(true);
        const [artRes, deptRes] = await Promise.allSettled([
          articleService.getArticles({ limit: 100 }),
          articleService.getDepartments(),
        ]);

        if (!isMounted) return;

        if (artRes.status === 'fulfilled' && artRes.value) {
          const rawArts = artRes.value.data;
          const arts = Array.isArray(rawArts)
            ? rawArts
            : Array.isArray(rawArts?.data)
            ? rawArts.data
            : [];
          setArticlesList(arts);
        }

        if (deptRes.status === 'fulfilled' && deptRes.value) {
          const rawDepts = deptRes.value.data;
          const depts = Array.isArray(rawDepts)
            ? rawDepts
            : Array.isArray(rawDepts?.data)
            ? rawDepts.data
            : [];
          setDepartmentsList(depts);
        }
      } catch (err) {
        console.error('Failed to load auxiliary articles/departments:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSelectableData();
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4500);
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Revert all unsaved changes
  const handleDiscard = () => {
    setFormData({
      ...DEFAULT_PAGE_SETTINGS,
      ...settings,
    });
    showToast('Unsaved changes discarded. Restored current live configuration.');
  };

  // Save all settings to backend
  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      // Serialize arrays/objects into JSON strings for backend key-value storage
      const payload = {
        header_brand_title: formData.header_brand_title,
        header_brand_subtitle: formData.header_brand_subtitle,
        header_edition_text: formData.header_edition_text,
        header_date_mode: formData.header_date_mode,

        ticker_enabled: String(formData.ticker_enabled),
        ticker_speed_ms: String(formData.ticker_speed_ms),
        ticker_items: JSON.stringify(formData.ticker_items || []),

        slideshow_speed_ms: String(formData.slideshow_speed_ms),
        slideshow_custom_slides: JSON.stringify(formData.slideshow_custom_slides || []),

        curated_lead_article_id: String(formData.curated_lead_article_id || ''),
        curated_secondary_article_ids: JSON.stringify(formData.curated_secondary_article_ids || []),

        footer_description: formData.footer_description,
        footer_accreditation: formData.footer_accreditation,
        footer_motto: formData.footer_motto,
        footer_address: formData.footer_address,
        footer_phone: formData.footer_phone,
        footer_email: formData.footer_email,
        footer_college_url: formData.footer_college_url,
        footer_college_label: formData.footer_college_label,
        footer_copyright: formData.footer_copyright,
      };

      await updateSettingsBulk(payload);
      showToast('Live broadsheet page successfully synchronized with 1:1 visual parity.');
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // TICKER ITEMS HELPERS
  // -------------------------------------------------------------------------
  const handleAddTickerItem = () => {
    if (!newTickerText.trim()) return;
    const newItem = {
      id: `t-${Date.now()}`,
      text: newTickerText.trim(),
      category: newTickerCategory.trim() || 'Gazette',
      link: newTickerLink.trim() || '/circulars',
    };
    const updated = [...(formData.ticker_items || []), newItem];
    handleFieldChange('ticker_items', updated);
    setNewTickerText('');
    setNewTickerCategory('Gazette');
    setNewTickerLink('/circulars');
  };

  const handleUpdateTickerItem = (index, field, value) => {
    const list = [...(formData.ticker_items || [])];
    if (!list[index]) return;
    list[index] = { ...list[index], [field]: value };
    handleFieldChange('ticker_items', list);
  };

  const handleDeleteTickerItem = (index) => {
    const list = [...(formData.ticker_items || [])];
    list.splice(index, 1);
    handleFieldChange('ticker_items', list);
  };

  const handleMoveTickerItem = (index, direction) => {
    const list = [...(formData.ticker_items || [])];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const [moved] = list.splice(index, 1);
    list.splice(targetIdx, 0, moved);
    handleFieldChange('ticker_items', list);
  };

  // -------------------------------------------------------------------------
  // SLIDESHOW HELPERS & MEDIA UPLOAD
  // -------------------------------------------------------------------------
  const handleAddSlide = () => {
    const newSlide = {
      id: `s-${Date.now()}`,
      image: '/images/campus/mcc-main-facade.jpg',
      title: 'New Campus Feature & Architectural Landmark',
      caption: 'A description of this collegiate sanctuary space in Tambaram.',
      category: 'CAMPUS SANCTUARY',
      tag: 'COLLEGIATE FRONTISPIECE • TAMBARAM ESTATE',
      link: '/about',
    };
    handleFieldChange('slideshow_custom_slides', [
      ...(formData.slideshow_custom_slides || []),
      newSlide,
    ]);
  };

  const handleUpdateSlide = (index, field, value) => {
    const list = [...(formData.slideshow_custom_slides || [])];
    if (!list[index]) return;
    list[index] = { ...list[index], [field]: value };
    handleFieldChange('slideshow_custom_slides', list);
  };

  const handleDeleteSlide = (index) => {
    const list = [...(formData.slideshow_custom_slides || [])];
    list.splice(index, 1);
    handleFieldChange('slideshow_custom_slides', list);
  };

  const handleMoveSlide = (index, direction) => {
    const list = [...(formData.slideshow_custom_slides || [])];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const [moved] = list.splice(index, 1);
    list.splice(targetIdx, 0, moved);
    handleFieldChange('slideshow_custom_slides', list);
  };

  const triggerUploadForSlide = (index) => {
    setUploadTargetSlideIndex(index);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || uploadTargetSlideIndex === null) return;

    try {
      setUploadingImage(true);
      const res = await articleService.uploadSettingMedia(file);
      if (res && res.url) {
        handleUpdateSlide(uploadTargetSlideIndex, 'image', res.url);
        showToast('Image uploaded successfully to server uploads.');
      }
    } catch (err) {
      console.error('Failed to upload slide image:', err);
      alert('Upload failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploadingImage(false);
      setUploadTargetSlideIndex(null);
      if (e.target) e.target.value = '';
    }
  };

  // -------------------------------------------------------------------------
  // CURATED FRONTPAGE HELPERS
  // -------------------------------------------------------------------------
  const handleToggleSecondaryArticle = (articleId) => {
    const strId = String(articleId);
    let list = [...(formData.curated_secondary_article_ids || [])].map(String);
    if (list.includes(strId)) {
      list = list.filter((id) => id !== strId);
    } else {
      if (list.length >= 4) {
        alert('You can select a maximum of 4 secondary lead articles.');
        return;
      }
      list.push(strId);
    }
    handleFieldChange('curated_secondary_article_ids', list);
  };

  const handleMoveSecondaryArticle = (index, direction) => {
    const list = [...(formData.curated_secondary_article_ids || [])];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const [moved] = list.splice(index, 1);
    list.splice(targetIdx, 0, moved);
    handleFieldChange('curated_secondary_article_ids', list);
  };

  // -------------------------------------------------------------------------
  // DEPARTMENT EDITING MODAL / IN-PLACE
  // -------------------------------------------------------------------------
  const handleSaveDepartment = async (dept) => {
    try {
      setDeptSaveLoading(true);
      await articleService.updateDepartment(dept.id, {
        name: dept.name,
        code: dept.code,
        stream: dept.stream,
        head_of_department: dept.head_of_department,
        contact_email: dept.contact_email,
        description: dept.description,
      });
      showToast(`Department '${dept.name}' updated successfully.`);
      setEditingDept(null);
      // Refresh list
      const res = await articleService.getDepartments();
      const list = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
      setDepartmentsList(list);
    } catch (err) {
      console.error('Failed to update department:', err);
      alert(err.response?.data?.error || 'Failed to update department.');
    } finally {
      setDeptSaveLoading(false);
    }
  };

  const filteredDepts = departmentsList.filter((d) => {
    const matchesStream =
      deptFilterStream === 'All' || d.stream === deptFilterStream;
    const q = deptSearch.toLowerCase().trim();
    const matchesQuery =
      !q ||
      d.name?.toLowerCase().includes(q) ||
      d.code?.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q);
    return matchesStream && matchesQuery;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hidden file input for hero uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
      />

      {/* 1. TOP HEADER & INSTANT SAVE BAR */}
      <div className="bg-white border-2 border-[#581A20]/20 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#581A20] text-[#C5A059] text-[10px] font-serif uppercase tracking-widest font-bold rounded">
              <Sparkles className="w-3 h-3 text-[#C5A059]" />
              Super Admin Control
            </span>
            <span className="text-xs font-mono text-gray-500">1:1 Visual Broadsheet Parity</span>
          </div>
          <h1 className="text-2xl font-serif font-black text-gray-900 tracking-tight mt-1">
            Live Broadsheet Dynamic Content Studio
          </h1>
          <p className="text-xs font-serif text-gray-600 mt-0.5">
            Every field configured below instantly updates visual broadsheet components across the public portal.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 border border-gray-300 text-gray-700 rounded text-xs font-serif font-semibold hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
            title="View Live Public Broadsheet in New Tab"
          >
            <Eye className="w-3.5 h-3.5 text-gray-500" />
            <span>View Live Site</span>
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </Link>

          <button
            type="button"
            onClick={handleDiscard}
            disabled={saving}
            className="px-3.5 py-2 border border-gray-300 text-gray-700 rounded text-xs font-serif font-semibold hover:bg-gray-100 transition-colors"
          >
            Discard
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="px-5 py-2 bg-[#581A20] text-white hover:bg-[#431419] rounded text-xs font-serif font-bold tracking-wider uppercase flex items-center gap-2 transition-all shadow-xs disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C5A059]" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS & ERRORS */}
      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded text-xs font-serif flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded text-xs font-serif flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. SECTION TABS (1:1 with Visual Components) */}
      <div className="border-b border-gray-200 bg-white rounded-t-lg px-2 pt-2 shadow-2xs">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'masthead', label: '1. Masthead & Header', icon: ShieldCheck },
            { id: 'ticker', label: '2. Breaking News Ticker', icon: Bell },
            { id: 'slideshow', label: '3. Hero Slideshow', icon: ImageIcon },
            { id: 'frontpage', label: '4. Curated Front Page', icon: Newspaper },
            { id: 'departments', label: '5. Department Explorer (38)', icon: BookOpen },
            { id: 'footer', label: '6. Footer & Institutional Info', icon: Globe },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-serif uppercase tracking-wider font-bold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-[#581A20] text-[#581A20] bg-gray-50/80 rounded-t'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#C5A059]' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* TAB 1: MASTHEAD & HEADER                                           */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'masthead' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-lg font-serif font-bold text-gray-900">
                Institutional Masthead & Utility Header
              </h2>
              <p className="text-xs text-gray-500 font-serif">
                Configure official collegiate naming, subheadings, and header date presentation format.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-serif font-bold text-gray-800 uppercase tracking-wider block">
                  Institutional Header Title / College Branding Name
                </label>
                <input
                  type="text"
                  value={formData.header_brand_title || ''}
                  onChange={(e) => handleFieldChange('header_brand_title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-serif focus:ring-1 focus:ring-[#581A20] focus:border-[#581A20]"
                  placeholder="e.g. Madras Christian College"
                />
                <span className="text-[11px] text-gray-400 font-serif">
                  Primary brand title rendered on the solid maroon header bar beside the MCC crest.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-serif font-bold text-gray-800 uppercase tracking-wider block">
                  Subtitle / Newsroom Tagline
                </label>
                <input
                  type="text"
                  value={formData.header_brand_subtitle || ''}
                  onChange={(e) => handleFieldChange('header_brand_subtitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-sans tracking-widest uppercase focus:ring-1 focus:ring-[#581A20] focus:border-[#581A20]"
                  placeholder="e.g. CAMPUS NEWS PORTAL"
                />
                <span className="text-[11px] text-gray-400 font-serif">
                  Uppercase gold subheader rendered directly below the institutional name.
                </span>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-serif font-bold text-gray-800 uppercase tracking-wider block">
                  Edition & Accreditation Banner Text
                </label>
                <input
                  type="text"
                  value={formData.header_edition_text || ''}
                  onChange={(e) => handleFieldChange('header_edition_text', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-serif focus:ring-1 focus:ring-[#581A20] focus:border-[#581A20]"
                  placeholder="e.g. Autonomous Institution • Affiliated to University of Madras • NAAC A++"
                />
                <span className="text-[11px] text-gray-400 font-serif">
                  Top utility bar announcement text displayed on Midnight Navy background.
                </span>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-serif font-bold text-gray-800 uppercase tracking-wider block">
                  Header Date Formatting Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'live', title: 'Full Weekday (Live)', sample: 'Wednesday, October 14, 2026' },
                    { id: 'short', title: 'Standard Short', sample: 'Oct 14, 2026' },
                    { id: 'iso', title: 'ISO Gazette', sample: '2026-10-14' },
                  ].map((mode) => (
                    <label
                      key={mode.id}
                      className={`flex flex-col p-3 border rounded cursor-pointer transition-all ${
                        formData.header_date_mode === mode.id
                          ? 'border-[#581A20] bg-[#581A20]/5 ring-1 ring-[#581A20]'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-serif font-bold text-gray-900">{mode.title}</span>
                        <input
                          type="radio"
                          name="header_date_mode"
                          checked={formData.header_date_mode === mode.id}
                          onChange={() => handleFieldChange('header_date_mode', mode.id)}
                          className="text-[#581A20] focus:ring-[#581A20]"
                        />
                      </div>
                      <span className="text-[11px] text-gray-500 font-mono mt-1">{mode.sample}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 1:1 LIVE PREVIEW BOX */}
          <div className="space-y-2">
            <span className="text-xs font-serif font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-gray-400" />
              1:1 Live Component Parity Preview
            </span>
            <div className="border border-gray-300 rounded overflow-hidden shadow-sm">
              {/* Top Navy Bar Preview */}
              <div className="bg-[#0F2537] text-white py-1.5 px-4 text-xs font-sans flex items-center justify-between border-b border-[#C5A059]/30">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="flex items-center gap-1 text-[#FAF8F5] font-semibold uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
                    {formData.header_date_mode === 'short'
                      ? 'Oct 14, 2026'
                      : formData.header_date_mode === 'iso'
                      ? '2026-10-14'
                      : 'Wednesday, October 14, 2026'}
                  </span>
                  <span className="text-[#C5A059]">•</span>
                  <span className="text-[#FAF8F5]/80 font-medium truncate">
                    {formData.header_edition_text || 'Autonomous Institution • Affiliated to University of Madras • NAAC A++'}
                  </span>
                </div>
                <div className="text-[11px] text-[#C5A059] font-medium hidden sm:inline">
                  Circulars • Accessibility A/A+
                </div>
              </div>

              {/* Maroon Header Bar Preview */}
              <div className="bg-[#581A20] border-b-4 border-[#C5A059] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src="/assets/mcc-crest.png"
                    alt="MCC Crest"
                    className="h-10 w-auto object-contain brightness-105"
                  />
                  <div>
                    <div className="font-serif font-bold text-lg text-white leading-none">
                      {formData.header_brand_title || 'Madras Christian College'}
                    </div>
                    <div className="text-[10px] font-sans font-bold tracking-[0.2em] text-[#C5A059] uppercase mt-0.5">
                      {formData.header_brand_subtitle || 'CAMPUS NEWS PORTAL'}
                    </div>
                  </div>
                </div>
                <div className="hidden sm:flex items-center space-x-3 text-xs uppercase font-sans font-semibold text-white/90">
                  <span className="text-[#C5A059] border-b-2 border-[#C5A059] pb-0.5">Home</span>
                  <span>Campus News</span>
                  <span>Departments</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 2: BREAKING NEWS TICKER                                        */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'ticker' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs space-y-6">
            <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-serif font-bold text-gray-900">
                  Breaking News Bulletin Ticker Controls
                </h2>
                <p className="text-xs text-gray-500 font-serif">
                  Manage active bullet dispatches, transition timing, and global ticker visibility.
                </p>
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center gap-3 bg-gray-50 px-3.5 py-1.5 rounded-full border border-gray-200">
                <span className="text-xs font-serif font-bold text-gray-700 uppercase tracking-wider">
                  Ticker Visibility:
                </span>
                <button
                  type="button"
                  onClick={() => handleFieldChange('ticker_enabled', !formData.ticker_enabled)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    formData.ticker_enabled ? 'bg-[#581A20]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      formData.ticker_enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span
                  className={`text-xs font-mono font-bold ${
                    formData.ticker_enabled ? 'text-emerald-700' : 'text-gray-500'
                  }`}
                >
                  {formData.ticker_enabled ? 'ACTIVE' : 'MUTED'}
                </span>
              </div>
            </div>

            {/* Scrolling Speed Configuration */}
            <div className="bg-gray-50/60 p-4 rounded border border-gray-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-serif font-bold text-gray-800 uppercase tracking-wider">
                  Slide Transition Speed (Delay in Milliseconds)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1500"
                    max="15000"
                    step="500"
                    value={formData.ticker_speed_ms || 4500}
                    onChange={(e) => handleFieldChange('ticker_speed_ms', Number(e.target.value))}
                    className="w-24 px-2.5 py-1 border border-gray-300 rounded text-xs font-mono text-center focus:ring-1 focus:ring-[#581A20]"
                  />
                  <span className="text-xs font-mono text-gray-500">ms</span>
                </div>
              </div>

              {/* Speed Presets */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-serif text-gray-500">Quick Presets:</span>
                {[
                  { ms: 3000, label: '3.0s (Fast)' },
                  { ms: 4500, label: '4.5s (Standard)' },
                  { ms: 6000, label: '6.0s (Relaxed)' },
                  { ms: 8000, label: '8.0s (Extended)' },
                ].map((preset) => (
                  <button
                    key={preset.ms}
                    type="button"
                    onClick={() => handleFieldChange('ticker_speed_ms', preset.ms)}
                    className={`px-2 py-0.5 text-[11px] rounded font-serif transition-colors ${
                      formData.ticker_speed_ms === preset.ms
                        ? 'bg-[#581A20] text-white font-bold'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Dynamic Ticker Items (CRUD) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif font-bold text-gray-800 uppercase tracking-wider">
                  Configured Bulletin Items ({formData.ticker_items?.length || 0})
                </span>
                <span className="text-[11px] text-gray-400 font-serif">
                  Reorder using arrows. Items cycle sequentially on public page.
                </span>
              </div>

              {(!formData.ticker_items || formData.ticker_items.length === 0) ? (
                <div className="p-4 text-center border-2 border-dashed border-gray-200 rounded text-xs text-gray-500 font-serif">
                  No custom bulletins defined. Broadsheet will display fallback gazette notices.
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.ticker_items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3 bg-white border border-gray-200 rounded-md shadow-2xs flex flex-col md:flex-row md:items-center gap-3 justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {/* Order controls */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleMoveTickerItem(idx, -1)}
                            disabled={idx === 0}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveTickerItem(idx, 1)}
                            disabled={idx === formData.ticker_items.length - 1}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Category Badge Input */}
                        <input
                          type="text"
                          value={item.category || ''}
                          onChange={(e) => handleUpdateTickerItem(idx, 'category', e.target.value)}
                          placeholder="Category"
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-xs font-bold text-[#C5A059] bg-[#0F2537] text-center uppercase"
                        />
                      </div>

                      {/* Text Input */}
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.text || ''}
                          onChange={(e) => handleUpdateTickerItem(idx, 'text', e.target.value)}
                          placeholder="Bulletin Dispatch Text"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-serif text-gray-900 focus:ring-1 focus:ring-[#581A20]"
                        />
                      </div>

                      {/* Link Input & Actions */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.link || ''}
                          onChange={(e) => handleUpdateTickerItem(idx, 'link', e.target.value)}
                          placeholder="Target Link (e.g. /circulars)"
                          className="w-36 px-2.5 py-1.5 border border-gray-300 rounded text-xs font-mono text-gray-600"
                        />

                        <button
                          type="button"
                          onClick={() => handleDeleteTickerItem(idx)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Remove Bulletin Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Ticker Item Row */}
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-md flex flex-col md:flex-row md:items-center gap-3">
                <input
                  type="text"
                  value={newTickerCategory}
                  onChange={(e) => setNewTickerCategory(e.target.value)}
                  placeholder="Category (e.g. Gazette)"
                  className="w-32 px-2.5 py-1.5 border border-gray-300 rounded text-xs font-serif font-bold uppercase"
                />
                <input
                  type="text"
                  value={newTickerText}
                  onChange={(e) => setNewTickerText(e.target.value)}
                  placeholder="Enter new breaking dispatch or collegiate bulletin notice..."
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-xs font-serif text-gray-900"
                />
                <input
                  type="text"
                  value={newTickerLink}
                  onChange={(e) => setNewTickerLink(e.target.value)}
                  placeholder="/destination-url"
                  className="w-36 px-2.5 py-1.5 border border-gray-300 rounded text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddTickerItem}
                  disabled={!newTickerText.trim()}
                  className="px-4 py-1.5 bg-[#581A20] text-white rounded text-xs font-serif font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#431419] disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Add Item</span>
                </button>
              </div>
            </div>
          </div>

          {/* 1:1 LIVE TICKER PREVIEW */}
          <div className="space-y-2">
            <span className="text-xs font-serif font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-gray-400" />
              1:1 Live Component Parity Preview
            </span>
            <div className="bg-white border-y border-[#581A20]/20 py-2 px-4 shadow-2xs flex items-center justify-between gap-3 text-xs font-serif">
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#581A20] text-white font-bold uppercase tracking-widest text-[11px] rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-ping" />
                  Dispatch Bulletin
                </span>
                <span className="text-gray-300">•</span>
              </div>
              <div className="flex-1 truncate flex items-center gap-2">
                {formData.ticker_items?.[0] ? (
                  <>
                    <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider bg-[#0F2537] px-1.5 py-0.5 rounded">
                      {formData.ticker_items[0].category}
                    </span>
                    <span className="truncate text-gray-800 font-medium">
                      {formData.ticker_items[0].text}
                    </span>
                  </>
                ) : (
                  <span className="italic text-gray-400">No active bulletins defined.</span>
                )}
              </div>
              <div className="text-[10px] font-mono text-gray-400 shrink-0">
                Delay: {formData.ticker_speed_ms || 4500}ms
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 3: DYNAMIC RECENT ARTICLES HERO SLIDESHOW                      */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'slideshow' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs space-y-6">
            <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-[11px] font-serif uppercase tracking-widest text-[#581A20] font-bold">
                  Dynamic News Dispatches & Cover Photography
                </span>
                <h2 className="text-lg font-serif font-bold text-gray-900">
                  Recent Articles Hero Slideshow Manager
                </h2>
                <p className="text-xs text-gray-500 font-serif">
                  The hero slideshow rotates the cover pictures, headlines, and subheadings of recent news stories. All fixed campus architectural photos have been purged.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {formData.slideshow_custom_slides && formData.slideshow_custom_slides.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleFieldChange('slideshow_custom_slides', [])}
                    className="px-3 py-1.5 border border-[#581A20]/40 text-[#581A20] hover:bg-[#581A20]/10 rounded text-xs font-serif font-bold transition-colors"
                  >
                    Reset to Auto (Latest Articles)
                  </button>
                )}
              </div>
            </div>

            {/* Slide Transition Speed Setting */}
            <div className="bg-gray-50/70 p-4 rounded border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-serif font-bold text-gray-800 uppercase tracking-wider block">
                  Slideshow Transition Interval
                </label>
                <span className="text-[11px] text-gray-500 font-serif">
                  Auto-rotation delay before cross-fading to the next recent article dispatch.
                </span>
              </div>
              <div className="flex items-center gap-2">
                {[3000, 4500, 6000, 8000].map((ms) => (
                  <button
                    key={ms}
                    type="button"
                    onClick={() => handleFieldChange('slideshow_speed_ms', ms)}
                    className={`px-3 py-1 text-xs rounded font-serif transition-colors ${
                      formData.slideshow_speed_ms === ms
                        ? 'bg-[#581A20] text-white font-bold'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {ms / 1000}s
                  </button>
                ))}
                <span className="text-xs font-mono text-gray-400 ml-1">
                  ({formData.slideshow_speed_ms || 4500}ms)
                </span>
              </div>
            </div>

            {/* Live Feed Stream Indicator */}
            {(!formData.slideshow_custom_slides || formData.slideshow_custom_slides.length === 0) ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-serif font-bold text-emerald-900 uppercase tracking-wider">
                      Automatic Recent Articles Stream Active
                    </h4>
                    <p className="text-xs text-emerald-800 font-serif mt-0.5 leading-relaxed">
                      The slideshow automatically streams the cover pictures, headings, and subheadings of the top 6 published articles directly from the newsroom database. Publishing or updating stories instantly promotes them to the live hero slideshow.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-serif font-bold text-gray-700 uppercase tracking-wider block">
                    Current Stories in Active Hero Rotation ({articlesList.slice(0, 6).length}):
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {articlesList.slice(0, 6).map((art, idx) => (
                      <div
                        key={art.id || idx}
                        className="p-3 bg-white border border-gray-200 rounded flex gap-3 items-center shadow-2xs"
                      >
                        <div className="w-20 h-14 bg-gray-100 rounded overflow-hidden shrink-0 border border-gray-200">
                          {art.cover_image ? (
                            <img
                              src={art.cover_image}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-mono">
                              No Cover
                            </div>
                          )}
                        </div>

                        <div className="flex-1 truncate">
                          <span className="text-[10px] font-mono text-[#C5A059] bg-[#0F2537] px-1.5 py-0.5 rounded uppercase font-bold">
                            {art.category_name || 'News'}
                          </span>
                          <h5 className="text-xs font-serif font-bold text-gray-900 truncate mt-1">
                            {art.title}
                          </h5>
                          <p className="text-[11px] text-gray-500 font-serif truncate mt-0.5">
                            {art.summary || 'Glance into the news dispatch...'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Curated Slides list if Super Admin chose specific articles */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-serif font-bold text-gray-800 uppercase tracking-wider">
                    Curated Slides in Rotation ({formData.slideshow_custom_slides.length})
                  </span>
                </div>

                {formData.slideshow_custom_slides.map((slide, idx) => (
                  <div
                    key={slide.id || idx}
                    className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <span className="text-xs font-serif font-bold text-gray-800 uppercase">
                        Slide #{idx + 1}: {slide.title}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveSlide(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveSlide(idx, 1)}
                          disabled={idx === formData.slideshow_custom_slides.length - 1}
                          className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSlide(idx)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      <div className="md:col-span-3 aspect-video bg-gray-100 rounded overflow-hidden border">
                        <img
                          src={slide.image || '/images/mcc-academic-quad-hd.jpg'}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="md:col-span-9 space-y-2">
                        <input
                          type="text"
                          value={slide.title || ''}
                          onChange={(e) => handleUpdateSlide(idx, 'title', e.target.value)}
                          placeholder="Article Heading"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-serif font-bold"
                        />
                        <textarea
                          rows="2"
                          value={slide.caption || ''}
                          onChange={(e) => handleUpdateSlide(idx, 'caption', e.target.value)}
                          placeholder="Article Subheading / Glance into news"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-serif"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 1:1 LIVE HERO SLIDESHOW PREVIEW */}
          <div className="space-y-2">
            <span className="text-xs font-serif font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-gray-400" />
              1:1 Live Component Parity Preview (Recent Articles Hero)
            </span>
            <div className="relative rounded-lg overflow-hidden border border-[#C5A059]/40 bg-[#0F2537] min-h-[300px] flex flex-col justify-end p-5 text-white">
              {articlesList[0]?.cover_image && (
                <img
                  src={articlesList[0].cover_image}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />

              <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#581A20] text-white text-[10px] font-serif uppercase tracking-widest font-bold rounded">
                    RECENT DISPATCH
                  </span>
                  <span className="px-2 py-0.5 bg-[#C5A059] text-[#0F2537] text-[10px] font-sans font-bold uppercase rounded">
                    {articlesList[0]?.category_name || 'CAMPUS NEWS'}
                  </span>
                </div>
                <h3 className="text-xl font-serif font-black text-white leading-tight">
                  {articlesList[0]?.title || 'Recent Article Heading'}
                </h3>
                <p className="text-xs text-gray-200 font-serif line-clamp-2 max-w-xl">
                  {articlesList[0]?.summary ||
                    'Article subheading providing an immediate glance into the news before reading the full story.'}
                </p>
                <div className="text-[11px] text-[#C5A059] font-serif font-semibold pt-1">
                  Read Full Dispatch →
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 4: CURATED FRONT PAGE                                          */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'frontpage' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-lg font-serif font-bold text-gray-900">
                Curated Front Page Editorial Layout
              </h2>
              <p className="text-xs text-gray-500 font-serif">
                Select which specific verified articles appear in the Grand Lead Story and Secondary Lead grid.
              </p>
            </div>

            {/* 1. LEAD STORY PICKER */}
            <div className="space-y-3 bg-gray-50/70 p-4 rounded-lg border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-serif uppercase tracking-widest text-[#581A20] font-bold">
                    Primary Broadsheet Anchor
                  </span>
                  <h3 className="text-sm font-serif font-bold text-gray-900">
                    Grand Lead Story Assignment
                  </h3>
                </div>

                {formData.curated_lead_article_id && (
                  <button
                    type="button"
                    onClick={() => handleFieldChange('curated_lead_article_id', '')}
                    className="text-xs font-serif text-[#581A20] hover:underline flex items-center gap-1"
                  >
                    <span>Reset to Automatic (Latest Story)</span>
                  </button>
                )}
              </div>

              <select
                value={formData.curated_lead_article_id || ''}
                onChange={(e) => handleFieldChange('curated_lead_article_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-serif text-gray-900 bg-white focus:ring-1 focus:ring-[#581A20]"
              >
                <option value="">-- Automatic: Display Most Recent Published Article --</option>
                {articlesList.map((art) => (
                  <option key={art.id} value={art.id}>
                    #{art.id} • [{art.category_name || art.department_code || 'General'}] {art.title}
                  </option>
                ))}
              </select>

              {/* Lead story preview badge */}
              {(() => {
                const lead = articlesList.find(
                  (a) => String(a.id) === String(formData.curated_lead_article_id)
                );
                if (!lead) return null;
                return (
                  <div className="p-3 bg-white border border-[#C5A059]/40 rounded flex items-center gap-3">
                    {lead.cover_image && (
                      <img
                        src={lead.cover_image}
                        alt=""
                        className="w-16 h-12 object-cover rounded shrink-0 border"
                      />
                    )}
                    <div className="flex-1 truncate">
                      <span className="text-[10px] font-serif uppercase font-bold text-[#C5A059] block">
                        Assigned Lead Feature
                      </span>
                      <span className="text-xs font-serif font-bold text-gray-900 truncate block">
                        {lead.title}
                      </span>
                      <span className="text-[11px] text-gray-500 font-serif">
                        By {lead.author_name || 'Staff'} • {lead.category_name || 'Campus News'}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 2. SECONDARY LEAD STORIES (UP TO 4) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-serif uppercase tracking-widest text-[#581A20] font-bold">
                    Four-Column Editorial Grid
                  </span>
                  <h3 className="text-sm font-serif font-bold text-gray-900">
                    Secondary Lead Stories ({formData.curated_secondary_article_ids?.length || 0}/4 Selected)
                  </h3>
                </div>
                <span className="text-[11px] text-gray-400 font-serif">
                  Select up to 4 articles from the published database archives.
                </span>
              </div>

              {/* Selected List */}
              {Array.isArray(formData.curated_secondary_article_ids) &&
                formData.curated_secondary_article_ids.length > 0 && (
                  <div className="space-y-2">
                    {formData.curated_secondary_article_ids.map((id, idx) => {
                      const item = articlesList.find((a) => String(a.id) === String(id));
                      return (
                        <div
                          key={id}
                          className="p-3 bg-white border border-gray-200 rounded flex items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-gray-100 text-gray-700 text-xs font-mono font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div className="truncate">
                              <span className="text-xs font-serif font-bold text-gray-900 block truncate">
                                {item ? item.title : `Article #${id}`}
                              </span>
                              {item && (
                                <span className="text-[10px] text-gray-400 font-serif">
                                  {item.category_name} • By {item.author_name || 'Correspondent'}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveSecondaryArticle(idx, -1)}
                              disabled={idx === 0}
                              className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveSecondaryArticle(idx, 1)}
                              disabled={
                                idx === formData.curated_secondary_article_ids.length - 1
                              }
                              className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleSecondaryArticle(id)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded ml-1"
                              title="Remove Story"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              {/* Quick Article Checkbox Selector */}
              <div className="border border-gray-200 rounded-md p-3 bg-gray-50/50 max-h-60 overflow-y-auto space-y-1.5 text-xs font-serif">
                <span className="text-[11px] font-serif font-bold text-gray-500 uppercase tracking-wider block mb-2">
                  Click to Add / Remove Stories from Secondary Grid:
                </span>
                {articlesList.map((art) => {
                  const isChecked = (formData.curated_secondary_article_ids || []).includes(
                    String(art.id)
                  );
                  return (
                    <label
                      key={art.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                        isChecked ? 'bg-[#581A20]/10 border border-[#581A20]/30' : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSecondaryArticle(art.id)}
                          className="rounded text-[#581A20] focus:ring-[#581A20]"
                        />
                        <span className="truncate font-medium text-gray-900">{art.title}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono shrink-0 ml-2">
                        {art.category_name || 'Desk'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 5: DEPARTMENT EXPLORER (38 DEPARTMENTS)                         */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs space-y-6">
            <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-serif font-bold text-gray-900">
                  Collegiate Department Explorer (38 Department Bureaus)
                </h2>
                <p className="text-xs text-gray-500 font-serif">
                  Directly review and edit display names, bureau descriptions, and stream tags across all 38 departments.
                </p>
              </div>

              {/* Stream filter */}
              <div className="flex items-center gap-1.5">
                {['All', 'Aided', 'Self-Financed'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setDeptFilterStream(st)}
                    className={`px-3 py-1 rounded text-xs font-serif font-bold transition-colors ${
                      deptFilterStream === st
                        ? 'bg-[#581A20] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {st === 'All' ? 'All (38)' : st === 'Aided' ? 'Aided (Shift I)' : 'SFS (Shift II)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <input
              type="text"
              value={deptSearch}
              onChange={(e) => setDeptSearch(e.target.value)}
              placeholder="Search departments by name, code, or description..."
              className="w-full px-3 py-2 border border-gray-300 rounded text-xs font-serif"
            />

            {/* Department List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDepts.map((dept) => (
                <div
                  key={dept.id}
                  className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs space-y-2.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-[#C5A059] bg-[#0F2537] px-2 py-0.5 rounded">
                        {dept.code}
                      </span>
                      <span
                        className={`text-[10px] font-serif font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          dept.stream === 'Aided'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {dept.stream}
                      </span>
                    </div>

                    <h4 className="text-sm font-serif font-bold text-gray-900 mt-1.5 leading-snug">
                      {dept.name}
                    </h4>

                    <p className="text-xs text-gray-600 font-serif mt-1 line-clamp-3 leading-relaxed">
                      {dept.description || 'No introductory bureau description set.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 font-serif">
                      HOD: {dept.head_of_department || 'Department Bureau'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingDept({ ...dept })}
                      className="px-2.5 py-1 text-xs font-serif font-bold text-[#581A20] hover:bg-[#581A20]/10 rounded flex items-center gap-1 transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Bureau</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* EDIT DEPARTMENT MODAL */}
          {editingDept && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-serif font-bold text-base text-gray-900">
                    Edit Department Bureau: {editingDept.code}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingDept(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs font-serif">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">
                      Department Name
                    </label>
                    <input
                      type="text"
                      value={editingDept.name || ''}
                      onChange={(e) =>
                        setEditingDept((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm font-serif"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">
                      Introductory Description
                    </label>
                    <textarea
                      rows="4"
                      value={editingDept.description || ''}
                      onChange={(e) =>
                        setEditingDept((prev) => ({ ...prev, description: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-serif leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">
                        Head of Department
                      </label>
                      <input
                        type="text"
                        value={editingDept.head_of_department || ''}
                        onChange={(e) =>
                          setEditingDept((prev) => ({
                            ...prev,
                            head_of_department: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={editingDept.contact_email || ''}
                        onChange={(e) =>
                          setEditingDept((prev) => ({
                            ...prev,
                            contact_email: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setEditingDept(null)}
                    className="px-4 py-1.5 border border-gray-300 rounded text-xs font-serif"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveDepartment(editingDept)}
                    disabled={deptSaveLoading}
                    className="px-4 py-1.5 bg-[#581A20] text-white rounded text-xs font-serif font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#431419]"
                  >
                    {deptSaveLoading ? 'Saving...' : 'Save Department'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 6: FOOTER & INSTITUTIONAL INFO                                 */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'footer' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-lg font-serif font-bold text-gray-900">
                Institutional Footer & Contact Directory
              </h2>
              <p className="text-xs text-gray-500 font-serif">
                Configure official collegiate address, contact numbers, accreditation grades, and copyright line.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-serif font-bold text-gray-800 uppercase tracking-wider block">
                  Institutional Mission & Liberal Arts Description
                </label>
                <textarea
                  rows="3"
                  value={formData.footer_description || ''}
                  onChange={(e) => handleFieldChange('footer_description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs font-serif leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-serif font-bold text-gray-800 uppercase tracking-wider block">
                  Accreditation Line
                </label>
                <input
                  type="text"
                  value={formData.footer_accreditation || ''}
                  onChange={(e) => handleFieldChange('footer_accreditation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs font-serif"
                  placeholder="e.g. Autonomous Institution • NAAC A++ Grade"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-serif font-bold text-gray-800 uppercase tracking-wider block">
                  Institutional Motto & Foundation Year
                </label>
                <input
                  type="text"
                  value={formData.footer_motto || ''}
                  onChange={(e) => handleFieldChange('footer_motto', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs font-serif italic"
                  placeholder='e.g. Motto: "Lighted to Lighten" • Est. 1837'
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-serif font-bold text-gray-800 uppercase tracking-wider block">
                  Campus Physical Address
                </label>
                <textarea
                  rows="2"
                  value={formData.footer_address || ''}
                  onChange={(e) => handleFieldChange('footer_address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs font-serif leading-relaxed"
                  placeholder="Madras Christian College, Tambaram East, Chennai - 600059..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-serif font-bold text-gray-800 uppercase tracking-wider block">
                  Official Phone Number
                </label>
                <input
                  type="text"
                  value={formData.footer_phone || ''}
                  onChange={(e) => handleFieldChange('footer_phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs font-mono"
                  placeholder="+91 44 2239 0675"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-serif font-bold text-gray-800 uppercase tracking-wider block">
                  Principal / Administrative Email
                </label>
                <input
                  type="email"
                  value={formData.footer_email || ''}
                  onChange={(e) => handleFieldChange('footer_email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs font-mono"
                  placeholder="principal@mcc.edu.in"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-serif font-bold text-gray-800 uppercase tracking-wider block">
                  College Official Portal URL
                </label>
                <input
                  type="url"
                  value={formData.footer_college_url || ''}
                  onChange={(e) => handleFieldChange('footer_college_url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs font-mono"
                  placeholder="https://mcc.edu.in"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-serif font-bold text-gray-800 uppercase tracking-wider block">
                  College Portal Display Label
                </label>
                <input
                  type="text"
                  value={formData.footer_college_label || ''}
                  onChange={(e) => handleFieldChange('footer_college_label', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs font-serif"
                  placeholder="College Official Portal (mcc.edu.in)"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-serif font-bold text-gray-800 uppercase tracking-wider block">
                  Copyright Statement Line
                </label>
                <input
                  type="text"
                  value={formData.footer_copyright || ''}
                  onChange={(e) => handleFieldChange('footer_copyright', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs font-serif"
                  placeholder="Madras Christian College. All rights reserved. Official Campus News Portal."
                />
              </div>
            </div>
          </div>

          {/* 1:1 LIVE FOOTER PREVIEW */}
          <div className="space-y-2">
            <span className="text-xs font-serif font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-gray-400" />
              1:1 Live Component Parity Preview
            </span>
            <div className="bg-[#581A20] text-white border-t-4 border-[#C5A059] p-6 rounded shadow-sm space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-serif">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <img src="/assets/mcc-crest.png" alt="" className="h-10 w-auto" />
                    <div>
                      <div className="font-bold text-base leading-tight">
                        {formData.header_brand_title || 'Madras Christian College'}
                      </div>
                      <div className="text-[10px] text-[#C5A059] font-sans font-bold tracking-widest">
                        {formData.header_brand_subtitle || 'CAMPUS NEWS PORTAL'}
                      </div>
                    </div>
                  </div>
                  <p className="text-white/80 leading-relaxed text-[11px]">
                    {formData.footer_description}
                  </p>
                  <div className="text-[#C5A059] italic text-[11px]">
                    {formData.footer_motto}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[#C5A059] font-bold uppercase tracking-wider">
                    Tambaram Campus Contact
                  </div>
                  <div className="text-white/85 text-[11px] whitespace-pre-line leading-relaxed">
                    {formData.footer_address}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-[#C5A059]">
                    <span>{formData.footer_phone}</span>
                    <span>•</span>
                    <span>{formData.footer_email}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#C5A059]/30 pt-3 text-[11px] text-white/70 flex items-center justify-between">
                <span>
                  &copy; {new Date().getFullYear()} {formData.footer_copyright}
                </span>
                <span className="text-[#C5A059]">Verified Institutional Seal</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
