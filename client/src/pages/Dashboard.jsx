import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/admin/AdminLayout';
import DashboardOverview from '../components/admin/DashboardOverview';
import ArticlesDesk from '../components/admin/ArticlesDesk';
import CircularManager from '../components/admin/CircularManager';
import GalleryManager from '../components/admin/GalleryManager';
import InquiriesManager from '../components/admin/InquiriesManager';
import CommentsManager from '../components/admin/CommentsManager';
import AuditLogExplorer from '../components/admin/AuditLogExplorer';
import BackupConsole from '../components/admin/BackupConsole';
import SettingsConsole from '../components/admin/SettingsConsole';
import UserManager from '../components/admin/UserManager';
import DepartmentManager from '../components/admin/DepartmentManager';
import CategoryManager from '../components/admin/CategoryManager';
import ArticleEditorModal from '../components/admin/ArticleEditorModal';

export default function Dashboard({ isSuperAdmin = false }) {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Detect Super Admin route
  const isSuper = isSuperAdmin || location.pathname.startsWith('/superadmin');

  // Unified Admin (/admin): Valid tabs are strictly 'articles' and 'gallery'
  const validAdminTabs = ['articles', 'gallery'];
  const defaultTab = isSuper ? 'settings' : 'articles';

  const tabParam = searchParams.get('tab');
  const resolvedTab = isSuper
    ? (tabParam || defaultTab)
    : (validAdminTabs.includes(tabParam) ? tabParam : 'articles');

  const [activeTab, setActiveTab] = useState(resolvedTab);

  // Standalone Article Editor Modal trigger for global quick actions
  const [isQuickArticleModalOpen, setIsQuickArticleModalOpen] = useState(false);

  // Synchronize state when query param or location changes
  useEffect(() => {
    const currentParam = searchParams.get('tab');
    const targetTab = isSuper
      ? (currentParam || 'settings')
      : (validAdminTabs.includes(currentParam) ? currentParam : 'articles');

    if (targetTab !== activeTab) {
      setActiveTab(targetTab);
    }
  }, [searchParams, isSuper, location.pathname]);

  // Handle tab selection
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  return (
    <AdminLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      isSuperAdmin={isSuper}
    >
      {/* ============================================================== */}
      {/* 1. ARTICLES DESK (Shared: Unified Admin & Super Admin)         */}
      {/* ============================================================== */}
      {activeTab === 'articles' && (
        <ArticlesDesk
          onComposeArticle={() => setIsQuickArticleModalOpen(true)}
        />
      )}

      {/* ============================================================== */}
      {/* 2. MEDIA & PHOTO GALLERY (Shared: Unified Admin & Super Admin)  */}
      {/* ============================================================== */}
      {activeTab === 'gallery' && <GalleryManager />}

      {/* ============================================================== */}
      {/* SUPER ADMIN MASTER GOVERNANCE CONSOLES (/superadmin ONLY)      */}
      {/* ============================================================== */}
      {isSuper && activeTab === 'settings' && <SettingsConsole />}
      {isSuper && activeTab === 'categories' && <CategoryManager />}
      {isSuper && activeTab === 'departments' && <DepartmentManager />}
      {isSuper && activeTab === 'users' && <UserManager />}
      {isSuper && activeTab === 'audit' && <AuditLogExplorer />}
      {isSuper && activeTab === 'backups' && <BackupConsole />}
      {isSuper && activeTab === 'overview' && (
        <DashboardOverview
          onNavigateTab={handleTabChange}
          onOpenArticleEditor={() => setIsQuickArticleModalOpen(true)}
          onOpenCircularModal={() => handleTabChange('circulars')}
          onOpenGalleryModal={() => handleTabChange('gallery')}
        />
      )}
      {isSuper && activeTab === 'circulars' && <CircularManager />}
      {isSuper && activeTab === 'inquiries' && <InquiriesManager />}
      {isSuper && activeTab === 'comments' && <CommentsManager />}

      {/* GLOBAL COMPOSE MODAL (Triggerable from Quick Action Row) */}
      <ArticleEditorModal
        isOpen={isQuickArticleModalOpen}
        onClose={() => setIsQuickArticleModalOpen(false)}
        onSaved={() => {
          setIsQuickArticleModalOpen(false);
          handleTabChange('articles');
        }}
      />
    </AdminLayout>
  );
}
