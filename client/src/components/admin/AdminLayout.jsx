import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ExternalLink,
  Menu,
  X,
  Calendar,
  ChevronRight,
  Shield,
  FileText,
} from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import UserProfileModal from './UserProfileModal';

export default function AdminLayout({ activeTab, onTabChange, children, badgeCounts = {}, isSuperAdmin = false }) {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const isSuper = isSuperAdmin || location.pathname.startsWith('/superadmin');

  const tabLabels = {
    overview: 'System Overview & Metrics',
    articles: 'Articles Desk',
    gallery: 'Photo Gallery & Slideshow',
    categories: 'Columns & Categories',
    circulars: 'Gazette & Circulars',
    passwords: 'Change Administrative Passwords',
    backups: 'Data Backups & Exports',
    settings: 'Layout & Visual Parity Controls',
  };

  const activeLabel = tabLabels[activeTab] || 'Editorial Desk';

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[#faf8f4] flex flex-col lg:flex-row antialiased text-gray-900 w-full max-w-full overflow-x-hidden">
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
              {isSuper ? 'SUPER ADMIN GOVERNANCE' : 'EDITORIAL DESK'}
            </h1>
            <p className="text-[10px] text-mcc-gold/80 font-serif tracking-widest uppercase">
              The MCC Chronicles
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded hover:bg-white/10 text-mcc-gold transition-colors cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* ============================================================== */}
      {/* LEFT SIDEBAR NAVIGATION */}
      {/* ============================================================== */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        isSuperAdmin={isSuper}
        badgeCounts={badgeCounts}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

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
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        {/* TOP BAR */}
        <header className="bg-white border-b border-mcc-maroon/20 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sticky top-0 z-30 shadow-xs">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs font-serif text-gray-500">
            <span className="font-bold text-mcc-maroon uppercase tracking-wider flex items-center gap-1.5">
              {isSuper ? (
                <>
                  <Shield className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>MCC Master Governance</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-mcc-maroon" />
                  <span>MCC Unified Admin</span>
                </>
              )}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-semibold text-gray-900 font-sans">
              {activeLabel}
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
              <span>Public Broadsheet</span>
            </Link>

            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-sans font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Live Console</span>
            </div>
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          {children}
        </main>

        {/* EDITORIAL FOOTER */}
        <footer className="mt-auto px-6 py-4 border-t border-mcc-maroon/10 bg-white text-center text-xs text-gray-500 font-serif">
          The MCC Chronicles Editorial Suite &bull; Madras Christian College, Tambaram &bull; Autonomous Press Engine
        </footer>
      </div>

      {/* USER DOSSIER & SECURITY MODAL */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}
