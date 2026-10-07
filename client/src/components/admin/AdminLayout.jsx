import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Bell,
  Image,
  Send,
  MessageSquare,
  Shield,
  Database,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Calendar,
  CheckCircle,
  Sparkles,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

export default function AdminLayout({ activeTab, onTabChange, children, badgeCounts = {} }) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const roleBadges = {
    super_admin: { label: 'Super Admin', color: 'bg-red-900 text-red-100 border-red-800' },
    editor: { label: 'Editor-in-Chief', color: 'bg-blue-900 text-blue-100 border-blue-800' },
    reporter: { label: 'Campus Reporter', color: 'bg-emerald-900 text-emerald-100 border-emerald-800' },
    faculty: { label: 'Faculty Advisor', color: 'bg-amber-900 text-amber-100 border-amber-800' },
  };

  const currentRole = roleBadges[user?.role] || { label: 'Editorial Staff', color: 'bg-gray-800 text-gray-100 border-gray-700' };

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      desc: 'Metrics & Quick Actions',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'articles',
      label: 'Articles Desk',
      desc: 'Drafts, Published, New Story',
      icon: FileText,
      badge: badgeCounts.articles || null,
    },
    {
      id: 'circulars',
      label: 'Gazette & Circulars',
      desc: 'Notices & Uploads',
      icon: Bell,
      badge: badgeCounts.circulars || null,
    },
    {
      id: 'gallery',
      label: 'Media Gallery',
      desc: 'Photo Asset Manager',
      icon: Image,
      badge: badgeCounts.gallery || null,
    },
    {
      id: 'inquiries',
      label: 'Inquiries & Tips',
      desc: 'Reader Correspondence',
      icon: Send,
      badge: badgeCounts.inquiries || null,
    },
    {
      id: 'comments',
      label: 'Comments Moderation',
      desc: 'Reader Discourse Desk',
      icon: MessageSquare,
      badge: badgeCounts.comments || null,
    },
    ...(user?.role === 'super_admin'
      ? [
          {
            id: 'audit',
            label: 'Audit Logs',
            desc: 'Security & Access Trail',
            icon: Shield,
            badge: null,
          },
          {
            id: 'backups',
            label: 'Data Backups',
            desc: 'Snapshots & Archival Exports',
            icon: Database,
            badge: null,
          },
          {
            id: 'settings',
            label: 'Site Settings',
            desc: 'Institutional Branding & Config',
            icon: Settings,
            badge: null,
          },
        ]
      : []),
  ];

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const activeItem = navItems.find((item) => item.id === activeTab) || navItems[0];

  const handleTabSelect = (tabId) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#faf8f4] flex flex-col lg:flex-row antialiased text-gray-900">
      {/* ============================================================== */}
      {/* MOBILE HEADER (SMALL SCREENS) */}
      {/* ============================================================== */}
      <div className="lg:hidden bg-mcc-navy text-white px-4 py-3 flex items-center justify-between border-b-2 border-mcc-gold sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-mcc-maroon border border-mcc-gold flex items-center justify-center font-serif font-black text-sm text-mcc-gold">
            MCC
          </div>
          <div>
            <h1 className="font-serif font-bold text-sm leading-tight tracking-wider text-mcc-halfwhite">
              EDITORIAL DESK
            </h1>
            <p className="text-[10px] text-mcc-gold/80 font-serif tracking-widest uppercase">
              The MCC Chronicles
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded hover:bg-white/10 text-mcc-gold transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* ============================================================== */}
      {/* LEFT SIDEBAR NAVIGATION */}
      {/* ============================================================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-mcc-navy text-white flex flex-col justify-between border-r-2 border-mcc-gold shadow-xl transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:h-screen lg:sticky lg:top-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* 1. BROADSHEET MONOGRAM BRANDING */}
          <div className="p-5 border-b border-white/10 bg-gradient-to-b from-black/20 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-sm bg-mcc-maroon border-2 border-mcc-gold flex items-center justify-center shadow-md">
                <span className="font-serif font-black text-xl text-mcc-gold tracking-tighter">MCC</span>
              </div>
              <div>
                <span className="text-[10px] font-serif uppercase tracking-widest text-mcc-gold block font-semibold">
                  ESTD. 1837 • CHENNAI
                </span>
                <h2 className="font-serif font-bold text-base leading-tight text-white tracking-wide">
                  Editorial Desk
                </h2>
                <p className="text-[11px] text-gray-300 font-sans">
                  The MCC Chronicles CMS
                </p>
              </div>
            </div>
          </div>

          {/* 2. NAVIGATION TABS */}
          <nav className="p-3 space-y-1 flex-1" aria-label="Editorial consoles">
            <div className="px-3 pt-2 pb-1 text-[10px] font-serif uppercase tracking-widest text-mcc-gold/70 font-semibold">
              Publishing Consoles
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-left transition-all group ${
                    isActive
                      ? 'bg-mcc-maroon text-white shadow-sm border-l-4 border-mcc-gold font-medium'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        isActive ? 'text-mcc-gold' : 'text-gray-400 group-hover:text-mcc-gold'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="font-serif text-sm font-semibold truncate leading-tight">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate font-sans">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-sans ${
                        isActive
                          ? 'bg-mcc-gold text-mcc-navy'
                          : 'bg-white/10 text-gray-200 group-hover:bg-mcc-gold group-hover:text-mcc-navy'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* 3. USER PROFILE & LOGOUT SECTION */}
        <div className="p-4 border-t border-white/10 bg-black/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-mcc-maroon border border-mcc-gold flex items-center justify-center text-mcc-gold font-serif font-black text-sm flex-shrink-0">
              {user?.name ? user.name[0].toUpperCase() : 'M'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-serif font-bold text-xs text-white truncate">
                {user?.name || 'Editorial Officer'}
              </div>
              <div className="text-[11px] text-gray-400 truncate">
                {user?.email}
              </div>
              <div className="mt-1">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-serif uppercase tracking-wider font-bold border ${currentRole.color}`}
                >
                  {currentRole.label}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
            <Link
              to="/"
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-serif transition-colors border border-white/10"
              title="View Live Broadsheet"
            >
              <ExternalLink className="w-3.5 h-3.5 text-mcc-gold" />
              <span>Public Site</span>
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-mcc-maroon hover:bg-red-800 text-white text-xs font-serif transition-colors border border-red-700/50"
              title="Sign out of editorial session"
            >
              <LogOut className="w-3.5 h-3.5 text-mcc-gold" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* ============================================================== */}
      {/* MAIN VIEWPORT & TOP BAR */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP BAR */}
        <header className="bg-white border-b border-mcc-maroon/20 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sticky top-0 z-30 shadow-xs">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs font-serif text-gray-500">
            <span className="font-bold text-mcc-maroon uppercase tracking-wider">
              MCC Editorial Desk
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-semibold text-gray-900 font-sans">
              {activeItem.label}
            </span>
          </div>

          {/* Right Top Bar Utilities */}
          <div className="flex items-center gap-4 text-xs font-serif">
            {/* Broadsheet Date */}
            <div className="hidden md:flex items-center gap-1.5 text-gray-600 bg-mcc-halfwhite border border-mcc-maroon/10 px-3 py-1 rounded">
              <Calendar className="w-3.5 h-3.5 text-mcc-gold" />
              <span className="font-medium">{formattedDate}</span>
            </div>

            {/* Public Link */}
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-mcc-navy hover:bg-mcc-maroon text-mcc-gold text-xs font-serif uppercase tracking-wider font-semibold rounded transition-colors shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Broadsheet</span>
            </Link>

            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-sans font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Live CMS</span>
            </div>
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* EDITORIAL FOOTER */}
        <footer className="mt-auto px-6 py-4 border-t border-mcc-maroon/10 bg-white text-center text-xs text-gray-500 font-serif">
          The MCC Chronicles Editorial Suite &bull; Madras Christian College, Tambaram &bull; Autonomous Press Engine
        </footer>
      </div>
    </div>
  );
}
