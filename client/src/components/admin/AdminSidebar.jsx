import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  Image,
  Settings,
  Layers,
  BookOpen,
  Shield,
  Database,
  Users,
  LayoutDashboard,
  Bell,
  Send,
  MessageSquare,
  ExternalLink,
  LogOut,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export default function AdminSidebar({
  activeTab,
  onTabChange,
  isSuperAdmin = false,
  badgeCounts = {},
  mobileMenuOpen = false,
  setMobileMenuOpen = () => {},
  onOpenProfile = () => {},
}) {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Route-based or explicit prop-based Super Admin check
  const isSuper = isSuperAdmin || location.pathname.startsWith('/superadmin');

  // Unified Admin (/admin): STRICTLY Article Desk and Photo Gallery
  const adminNavItems = [
    {
      id: 'articles',
      label: 'Articles Desk',
      desc: 'Drafts, Published, New Story',
      icon: FileText,
      badge: badgeCounts.articles || null,
    },
    {
      id: 'gallery',
      label: 'Photo Gallery',
      desc: 'Campus Photo & Asset Studio',
      icon: Image,
      badge: badgeCounts.gallery || null,
    },
  ];

  // Super Admin (/superadmin): Master Governance Consoles
  const superAdminNavItems = [
    {
      id: 'settings',
      label: 'Site Appearance & Branding',
      desc: 'Themes, Banners & Layout Config',
      icon: Settings,
      badge: null,
    },
    {
      id: 'categories',
      label: 'Columns & Categories',
      desc: 'Broadsheet Desks & Section Order',
      icon: Layers,
      badge: null,
    },
    {
      id: 'departments',
      label: '38 Department Bureaus',
      desc: 'Aided & SFS Directory Governance',
      icon: BookOpen,
      badge: null,
    },
    {
      id: 'articles',
      label: 'Articles Desk',
      desc: 'Master Dispatch Management',
      icon: FileText,
      badge: badgeCounts.articles || null,
    },
    {
      id: 'gallery',
      label: 'Media & Photo Gallery',
      desc: 'Campus Photo Asset Manager',
      icon: Image,
      badge: badgeCounts.gallery || null,
    },
    {
      id: 'users',
      label: 'Staff & Roles Governance',
      desc: 'Access Credentials & Accounts',
      icon: Users,
      badge: null,
    },
    {
      id: 'audit',
      label: 'System Health & Audit Logs',
      desc: 'Access Trail & Diagnostics',
      icon: Shield,
      badge: null,
    },
    {
      id: 'backups',
      label: 'Data Backups & Exports',
      desc: 'Snapshots & Archival Vault',
      icon: Database,
      badge: null,
    },
    {
      id: 'overview',
      label: 'System Overview & Metrics',
      desc: 'Readership & Quick Telemetry',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'circulars',
      label: 'Gazette & Circulars',
      desc: 'Institutional Notices Desk',
      icon: Bell,
      badge: badgeCounts.circulars || null,
    },
  ];

  const navItems = isSuper ? superAdminNavItems : adminNavItems;

  const handleTabSelect = (tabId) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-72 bg-mcc-navy text-white flex flex-col justify-between border-r-2 border-mcc-gold shadow-xl transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:h-screen lg:sticky lg:top-0 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* 1. BROADSHEET BRANDING HEADER */}
        <div className="p-5 border-b border-white/10 bg-gradient-to-b from-black/25 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-sm bg-mcc-maroon border-2 border-mcc-gold flex items-center justify-center shadow-md shrink-0">
              <span className="font-serif font-black text-lg text-mcc-gold tracking-tight">MCC</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-serif uppercase tracking-widest text-mcc-gold block font-semibold truncate">
                {isSuper ? 'MASTER GOVERNANCE' : 'UNIFIED EDITORIAL DESK'}
              </span>
              <h2 className="font-serif font-bold text-sm leading-tight text-white tracking-wide truncate">
                {isSuper ? 'Super Admin Suite' : 'Shared Admin Console'}
              </h2>
              <p className="text-[10px] text-gray-300 font-sans truncate">
                {isSuper ? 'Autonomous Press Engine' : 'All 38 Department Bureaus'}
              </p>
            </div>
          </div>
        </div>

        {/* 2. MODE SWITCHER (For Super Admin navigating between /superadmin and /admin) */}
        {user?.role === 'super_admin' && (
          <div className="px-3 pt-3">
            <div className="bg-black/30 p-1 rounded border border-white/10 flex text-[11px] font-serif">
              <Link
                to="/admin"
                className={`flex-1 text-center py-1 rounded transition-colors ${
                  !isSuper ? 'bg-mcc-maroon text-white font-bold' : 'text-gray-300 hover:text-white'
                }`}
              >
                Admin Desk
              </Link>
              <Link
                to="/superadmin"
                className={`flex-1 text-center py-1 rounded transition-colors ${
                  isSuper ? 'bg-[#C5A059] text-mcc-navy font-bold' : 'text-gray-300 hover:text-white'
                }`}
              >
                Super Admin
              </Link>
            </div>
          </div>
        )}

        {/* 3. NAVIGATION TABS */}
        <nav className="p-3 space-y-1.5 flex-1" aria-label="Editorial consoles">
          <div className="px-3 pt-2 pb-1 text-[10px] font-serif uppercase tracking-widest text-mcc-gold/80 font-semibold">
            {isSuper ? 'Governance Consoles' : 'Publishing Consoles'}
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
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-mcc-gold' : 'text-gray-400 group-hover:text-mcc-gold'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="font-serif text-xs sm:text-sm font-semibold truncate leading-tight">
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

      {/* 4. USER PROFILE & LOGOUT SECTION */}
      <div className="p-4 border-t border-white/10 bg-black/30">
        <div
          onClick={onOpenProfile}
          className="flex items-center gap-3 mb-3 p-1 -mx-1 rounded hover:bg-white/5 cursor-pointer transition-colors group"
          title="Click to view staff dossier & security settings"
        >
          <div className="w-9 h-9 rounded-full bg-mcc-maroon border border-mcc-gold flex items-center justify-center text-mcc-gold font-serif font-black text-xs shrink-0 overflow-hidden">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : user?.name ? (
              user.name[0].toUpperCase()
            ) : (
              'M'
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-serif font-bold text-xs text-white truncate group-hover:text-mcc-gold transition-colors flex items-center justify-between">
              <span>{user?.name || (isSuper ? 'Super Administrator' : 'Editorial Admin')}</span>
            </div>
            <div className="text-[11px] text-gray-400 truncate font-mono">
              {user?.email}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-serif uppercase tracking-wider font-bold ${
                  user?.role === 'super_admin'
                    ? 'bg-red-900 text-red-100 border border-red-700'
                    : 'bg-blue-900 text-blue-100 border border-blue-700'
                }`}
              >
                {user?.role === 'super_admin' ? 'Super Admin' : 'Unified Editor'}
              </span>
              <span className="text-[9px] text-mcc-gold/80 font-serif">
                {isSuper ? 'Master Console' : '38 Depts'}
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
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-mcc-maroon hover:bg-red-800 text-white text-xs font-serif transition-colors border border-red-700/50 cursor-pointer"
            title="Sign out of editorial session"
          >
            <LogOut className="w-3.5 h-3.5 text-mcc-gold" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
