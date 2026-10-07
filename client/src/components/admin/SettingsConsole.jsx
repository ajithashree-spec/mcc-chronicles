import React, { useState, useEffect } from 'react';
import articleService from '../../services/articleService';
import { useAuth } from '../../context/AuthContext';
import {
  Settings,
  Save,
  Lock,
  Globe,
  Mail,
  MapPin,
  Palette,
  Rss,
  Twitter,
  Linkedin,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Shield,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

const INITIAL_SETTINGS = {
  site_title: 'The MCC Chronicles',
  broadsheet_motto: 'Truth • Freedom • Excellence',
  volume_number: 'Vol. CXL',
  issue_number: 'Issue 4',
  contact_email: 'chronicles@mcc.edu.in',
  newsroom_address: 'Miller Memorial Library Quadrangle, Madras Christian College, Tambaram East, Chennai, Tamil Nadu 600059',
  primary_color: '#7B1113',
  secondary_color: '#002147',
  accent_gold: '#C5A059',
  rss_feed_url: '/api/feed/rss',
  atom_feed_url: '/api/feed/atom',
  twitter_handle: '@MCCChronicles',
  linkedin_url: 'https://linkedin.com/school/madras-christian-college',
  maintenance_mode: 'false',
  comments_enabled: 'true',
};

export default function SettingsConsole() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [form, setForm] = useState(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(null);

  // Super Admin security guard
  if (!isSuperAdmin) {
    return (
      <div className="p-8 bg-white border-2 border-red-800 rounded-lg shadow-sm text-center font-serif">
        <Lock className="w-12 h-12 text-red-800 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900">Archival Privilege Restricted</h2>
        <p className="text-xs text-gray-600 mt-2 max-w-md mx-auto">
          The Site Settings & Institutional Branding console is reserved strictly for Super
          Administrators of the MCC Chronicles digital gazette.
        </p>
      </div>
    );
  }

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await articleService.getSettings();
      if (res) {
        const remoteSettings = res.settings || res.data || {};
        setForm((prev) => ({
          ...prev,
          ...remoteSettings,
        }));
      }
    } catch (err) {
      console.error('Failed to load site settings:', err);
      // Fallback to default institutional presets
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await articleService.updateSettings(form);
      setNotification('Institutional branding & system settings successfully updated.');
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Failed to update settings:', err);
      setError('Settings update failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const isMaintenance = form.maintenance_mode === 'true' || form.maintenance_mode === true;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. BROADCAST HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-mcc-maroon pb-4">
        <div>
          <span className="text-[11px] font-serif uppercase tracking-widest text-mcc-gold font-bold">
            Administrative Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-gray-900 tracking-tight">
            Site Settings & Institutional Branding
          </h1>
          <p className="text-xs text-gray-600 font-serif mt-0.5">
            Configure broadsheet masthead identifiers, contact bureau addresses, typography colors, and system operational modes.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSettings}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-mcc-maroon/30 text-xs font-serif font-bold text-mcc-maroon hover:bg-mcc-maroon/5 rounded transition-colors self-start sm:self-auto shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Reload Config</span>
        </button>
      </div>

      {/* 2. NOTIFICATIONS & ALERTS */}
      {notification && (
        <div className="p-3.5 rounded bg-emerald-50 border-l-4 border-emerald-700 text-emerald-900 text-xs font-serif flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded bg-red-50 border-l-4 border-red-700 text-red-900 text-xs font-serif flex items-center gap-2.5 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-red-700 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. SETTINGS FORM */}
      <form onSubmit={handleSubmit} className="space-y-6 text-xs font-serif">
        {/* SECTION 1: BROADSHEET IDENTITY & MASTHEAD */}
        <div className="bg-white border border-mcc-maroon/20 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <Globe className="w-4 h-4 text-mcc-maroon" />
            <h2 className="font-serif font-bold text-sm text-gray-900">
              Broadsheet Identity & Editorial Masthead
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-600 font-bold mb-1">
                Publication Title
              </label>
              <input
                type="text"
                value={form.site_title || ''}
                onChange={(e) => handleChange('site_title', e.target.value)}
                placeholder="The MCC Chronicles"
                className="w-full p-2 bg-[#faf8f4] border border-gray-300 rounded font-serif font-bold text-sm text-gray-900 focus:border-mcc-maroon outline-hidden"
              />
              <p className="text-[10px] text-gray-500 font-sans mt-0.5">
                Displays on browser title bars, RSS syndication, and front page banner.
              </p>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-600 font-bold mb-1">
                Broadsheet Motto / Subheading
              </label>
              <input
                type="text"
                value={form.broadsheet_motto || ''}
                onChange={(e) => handleChange('broadsheet_motto', e.target.value)}
                placeholder="Truth • Freedom • Excellence"
                className="w-full p-2 bg-[#faf8f4] border border-gray-300 rounded font-serif text-xs text-gray-900 focus:border-mcc-maroon outline-hidden"
              />
              <p className="text-[10px] text-gray-500 font-sans mt-0.5">
                Latin or English traditional collegiate motto stamped beneath the crest.
              </p>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-600 font-bold mb-1">
                Volume Inscription
              </label>
              <input
                type="text"
                value={form.volume_number || ''}
                onChange={(e) => handleChange('volume_number', e.target.value)}
                placeholder="Vol. CXL"
                className="w-full p-2 bg-[#faf8f4] border border-gray-300 rounded font-serif text-xs text-gray-900 focus:border-mcc-maroon outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-600 font-bold mb-1">
                Issue Number
              </label>
              <input
                type="text"
                value={form.issue_number || ''}
                onChange={(e) => handleChange('issue_number', e.target.value)}
                placeholder="Issue 4"
                className="w-full p-2 bg-[#faf8f4] border border-gray-300 rounded font-serif text-xs text-gray-900 focus:border-mcc-maroon outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: NEWSROOM BUREAU & CONTACT DETAILS */}
        <div className="bg-white border border-mcc-maroon/20 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <Mail className="w-4 h-4 text-mcc-navy" />
            <h2 className="font-serif font-bold text-sm text-gray-900">
              Newsroom Bureau & Reader Correspondence
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-600 font-bold mb-1">
                Official Inquiries Email
              </label>
              <input
                type="email"
                value={form.contact_email || ''}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                placeholder="chronicles@mcc.edu.in"
                className="w-full p-2 bg-[#faf8f4] border border-gray-300 rounded font-sans text-xs text-gray-900 focus:border-mcc-maroon outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] uppercase tracking-wider text-gray-600 font-bold mb-1">
                Newsroom Bureau Physical Address
              </label>
              <textarea
                rows="2"
                value={form.newsroom_address || ''}
                onChange={(e) => handleChange('newsroom_address', e.target.value)}
                placeholder="Miller Memorial Library Quadrangle, Madras Christian College, Tambaram..."
                className="w-full p-2 bg-[#faf8f4] border border-gray-300 rounded font-serif text-xs text-gray-900 focus:border-mcc-maroon outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: THEME COLOR PALETTE */}
        <div className="bg-white border border-mcc-maroon/20 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <Palette className="w-4 h-4 text-mcc-gold" />
            <h2 className="font-serif font-bold text-sm text-gray-900">
              Collegiate Color Scheme & Branding Tokens
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-600 font-bold mb-1">
                Primary Brand Color (MCC Maroon)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primary_color || '#7B1113'}
                  onChange={(e) => handleChange('primary_color', e.target.value)}
                  className="w-9 h-9 p-0.5 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={form.primary_color || '#7B1113'}
                  onChange={(e) => handleChange('primary_color', e.target.value)}
                  className="flex-1 p-2 bg-[#faf8f4] border border-gray-300 rounded font-mono text-xs uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-600 font-bold mb-1">
                Secondary Brand Color (MCC Navy)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.secondary_color || '#002147'}
                  onChange={(e) => handleChange('secondary_color', e.target.value)}
                  className="w-9 h-9 p-0.5 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={form.secondary_color || '#002147'}
                  onChange={(e) => handleChange('secondary_color', e.target.value)}
                  className="flex-1 p-2 bg-[#faf8f4] border border-gray-300 rounded font-mono text-xs uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-600 font-bold mb-1">
                Accent Token (MCC Gold)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.accent_gold || '#C5A059'}
                  onChange={(e) => handleChange('accent_gold', e.target.value)}
                  className="w-9 h-9 p-0.5 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={form.accent_gold || '#C5A059'}
                  onChange={(e) => handleChange('accent_gold', e.target.value)}
                  className="flex-1 p-2 bg-[#faf8f4] border border-gray-300 rounded font-mono text-xs uppercase"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: SYNDICATION & SOCIAL LINKS */}
        <div className="bg-white border border-mcc-maroon/20 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <Rss className="w-4 h-4 text-orange-600" />
            <h2 className="font-serif font-bold text-sm text-gray-900">
              Syndication & Social Media Channels
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-600 font-bold mb-1">
                RSS 2.0 Syndication Feed
              </label>
              <input
                type="text"
                value={form.rss_feed_url || ''}
                onChange={(e) => handleChange('rss_feed_url', e.target.value)}
                placeholder="/api/feed/rss"
                className="w-full p-2 bg-[#faf8f4] border border-gray-300 rounded font-mono text-xs text-gray-900"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-600 font-bold mb-1">
                Atom 1.0 Syndication Feed
              </label>
              <input
                type="text"
                value={form.atom_feed_url || ''}
                onChange={(e) => handleChange('atom_feed_url', e.target.value)}
                placeholder="/api/feed/atom"
                className="w-full p-2 bg-[#faf8f4] border border-gray-300 rounded font-mono text-xs text-gray-900"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-600 font-bold mb-1">
                Twitter / X Handle
              </label>
              <input
                type="text"
                value={form.twitter_handle || ''}
                onChange={(e) => handleChange('twitter_handle', e.target.value)}
                placeholder="@MCCChronicles"
                className="w-full p-2 bg-[#faf8f4] border border-gray-300 rounded font-sans text-xs text-gray-900"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-600 font-bold mb-1">
                LinkedIn Institutional Page
              </label>
              <input
                type="text"
                value={form.linkedin_url || ''}
                onChange={(e) => handleChange('linkedin_url', e.target.value)}
                placeholder="https://linkedin.com/school/madras-christian-college"
                className="w-full p-2 bg-[#faf8f4] border border-gray-300 rounded font-sans text-xs text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: GOVERNANCE & MAINTENANCE MODE */}
        <div className="bg-white border border-mcc-maroon/20 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <Sliders className="w-4 h-4 text-purple-700" />
            <h2 className="font-serif font-bold text-sm text-gray-900">
              System Operations & Maintenance Toggle
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#faf8f4] border border-mcc-maroon/15 rounded">
            <div>
              <h3 className="font-serif font-bold text-xs text-gray-900">
                Maintenance Mode Lockdown
              </h3>
              <p className="text-[11px] text-gray-600 font-serif max-w-md mt-0.5">
                When active, public readers will encounter an institutional maintenance broadsheet notice.
                Editorial authenticated staff retain access to the dashboard.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleChange('maintenance_mode', isMaintenance ? 'false' : 'true')}
              className={`px-4 py-2 rounded text-xs font-serif font-bold flex items-center gap-2 transition-all ${
                isMaintenance
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {isMaintenance ? (
                <>
                  <ToggleRight className="w-5 h-5 text-amber-200" />
                  <span>Maintenance Mode Active</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5 text-gray-400" />
                  <span>Normal Public Mode</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* SUBMIT BUTTON BAR */}
        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-mcc-maroon hover:bg-mcc-maroon/90 text-white font-serif font-bold text-xs rounded shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className={`w-4 h-4 text-mcc-gold ${saving ? 'animate-spin' : ''}`} />
            <span>{saving ? 'Saving System Configuration...' : 'Save Settings & Institutional Config'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
