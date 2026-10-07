import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/admin/AdminLayout';
import DashboardOverview from '../components/admin/DashboardOverview';
import ArticleManager from '../components/admin/ArticleManager';
import CircularManager from '../components/admin/CircularManager';
import GalleryManager from '../components/admin/GalleryManager';
import InquiryManager from '../components/admin/InquiryManager';
import InquiriesManager from '../components/admin/InquiriesManager';
import CommentsManager from '../components/admin/CommentsManager';
import AuditManager from '../components/admin/AuditManager';
import AuditLogExplorer from '../components/admin/AuditLogExplorer';
import BackupConsole from '../components/admin/BackupConsole';
import SettingsConsole from '../components/admin/SettingsConsole';
import UserManager from '../components/admin/UserManager';
import ArticleEditorModal from '../components/admin/ArticleEditorModal';

export default function Dashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state synced with URL query parameter ?tab=...
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Standalone Article Editor Modal trigger for global quick actions
  const [isQuickArticleModalOpen, setIsQuickArticleModalOpen] = useState(false);

  // Synchronize state when query param changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Handle tab selection
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={handleTabChange}>
      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <DashboardOverview
          onNavigateTab={handleTabChange}
          onOpenArticleEditor={() => setIsQuickArticleModalOpen(true)}
          onOpenCircularModal={() => handleTabChange('circulars')}
          onOpenGalleryModal={() => handleTabChange('gallery')}
        />
      )}

      {/* 2. ARTICLES CONSOLE */}
      {activeTab === 'articles' && (
        <ArticleManager
          onComposeArticle={() => setIsQuickArticleModalOpen(true)}
        />
      )}

      {/* 3. CIRCULARS CONSOLE */}
      {activeTab === 'circulars' && <CircularManager />}

      {/* 4. GALLERY CONSOLE */}
      {activeTab === 'gallery' && <GalleryManager />}

      {/* 5. INQUIRIES & TIPS CONSOLE */}
      {activeTab === 'inquiries' && <InquiriesManager />}

      {/* 6. READER COMMENTS CONSOLE */}
      {activeTab === 'comments' && <CommentsManager />}

      {/* 7. AUDIT LOGS CONSOLE (Super Admin) */}
      {activeTab === 'audit' && user?.role === 'super_admin' && <AuditLogExplorer />}

      {/* 8. DATA BACKUPS & SNAPSHOTS (Super Admin) */}
      {activeTab === 'backups' && user?.role === 'super_admin' && <BackupConsole />}

      {/* 9. SITE SETTINGS & BRANDING (Super Admin) */}
      {activeTab === 'settings' && user?.role === 'super_admin' && <SettingsConsole />}

      {/* 10. USER & STAFF GOVERNANCE CONSOLE (Super Admin, Task 90) */}
      {activeTab === 'users' && user?.role === 'super_admin' && <UserManager />}

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
