import React, { useState, useEffect } from 'react';
import articleService from '../../services/articleService';
import {
  FileText,
  Eye,
  Bell,
  MessageSquare,
  TrendingUp,
  PlusCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Award,
  Sparkles,
  ChevronRight,
  BookOpen,
  Mail,
} from 'lucide-react';
import AnalyticsVisualizer from './AnalyticsVisualizer';
import NewsletterCampaignModal from './NewsletterCampaignModal';

export default function DashboardOverview({
  onNavigateTab,
  onOpenArticleEditor,
  onOpenCircularModal,
  onOpenGalleryModal,
}) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewsletterModal, setShowNewsletterModal] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const res = await articleService.getAnalytics();
      if (res && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard analytics:', err);
      setError('Unable to load analytics metrics. Please ensure you are logged in with valid editorial credentials.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const overview = stats?.overview || {
    total_articles: 0,
    published_articles: 0,
    pending_articles: 0,
    draft_articles: 0,
    total_views: 0,
    total_users: 0,
    pending_comments: 0,
  };

  const topArticles = stats?.topArticles || [];
  const departmentBreakdown = stats?.departmentBreakdown || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ============================================================== */}
      {/* 1. EDITORIAL HEADER & REFRESH */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-mcc-maroon pb-4">
        <div>
          <span className="text-[11px] font-serif uppercase tracking-widest text-mcc-gold font-bold">
            Editorial Central
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-gray-900 tracking-tight">
            Broadsheet Overview & Pulse
          </h1>
          <p className="text-xs text-gray-600 font-serif mt-0.5">
            Real-time publishing telemetry, readership volume, and editorial triage desk.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNewsletterModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-mcc-maroon hover:bg-mcc-maroon-dark text-white text-xs font-serif font-bold uppercase tracking-wider rounded shadow-xs transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-mcc-gold" />
            <span>Newsletter Campaign</span>
          </button>
          <button
            type="button"
            onClick={fetchStats}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-mcc-maroon/30 text-xs font-serif text-mcc-maroon hover:bg-mcc-maroon/5 rounded transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Metrics'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-700 p-4 rounded text-red-800 text-xs font-serif flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchStats}
            className="underline font-bold hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. FOUR KEY METRIC CARDS */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Published Dispatches */}
        <div className="bg-white border-t-4 border-mcc-maroon border-x border-b border-mcc-maroon/15 p-5 rounded shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-serif uppercase tracking-widest text-gray-500 font-bold">
                Published Dispatches
              </p>
              <h2 className="text-3xl font-serif font-black text-gray-900 mt-2">
                {overview.published_articles}
              </h2>
            </div>
            <div className="p-2.5 bg-mcc-maroon/10 rounded text-mcc-maroon">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-medium inline-flex items-center gap-1 font-sans">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Active on broadsheet</span>
            </span>
            <span className="text-gray-500 font-serif">
              {overview.total_articles} total stories
            </span>
          </div>
        </div>

        {/* Metric 2: Total Readership Views */}
        <div className="bg-white border-t-4 border-mcc-navy border-x border-b border-mcc-navy/15 p-5 rounded shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-serif uppercase tracking-widest text-gray-500 font-bold">
                Total Readership Views
              </p>
              <h2 className="text-3xl font-serif font-black text-gray-900 mt-2">
                {overview.total_views.toLocaleString()}
              </h2>
            </div>
            <div className="p-2.5 bg-mcc-navy/10 rounded text-mcc-navy">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-blue-700 font-medium font-sans">
              Campus engagement
            </span>
            <span className="text-gray-500 font-serif">
              Avg {overview.published_articles > 0 ? Math.round(overview.total_views / overview.published_articles) : 0}/story
            </span>
          </div>
        </div>

        {/* Metric 3: Editorial Pipeline / Drafts */}
        <div className="bg-white border-t-4 border-mcc-gold border-x border-b border-mcc-gold/20 p-5 rounded shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-serif uppercase tracking-widest text-gray-500 font-bold">
                Drafts & Review Desk
              </p>
              <h2 className="text-3xl font-serif font-black text-gray-900 mt-2">
                {overview.draft_articles + overview.pending_articles}
              </h2>
            </div>
            <div className="p-2.5 bg-mcc-gold/15 rounded text-amber-800">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-amber-800 font-medium font-sans">
              {overview.pending_articles} awaiting review
            </span>
            <span className="text-gray-500 font-serif">
              {overview.draft_articles} reporter drafts
            </span>
          </div>
        </div>

        {/* Metric 4: Reader Feedback & Inquiries */}
        <div className="bg-white border-t-4 border-emerald-800 border-x border-b border-emerald-800/15 p-5 rounded shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-serif uppercase tracking-widest text-gray-500 font-bold">
                Comments & Inquiries
              </p>
              <h2 className="text-3xl font-serif font-black text-gray-900 mt-2">
                {overview.pending_comments}
              </h2>
            </div>
            <div className="p-2.5 bg-emerald-800/10 rounded text-emerald-800">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-emerald-800 font-medium font-sans">
              Pending moderation
            </span>
            <span className="text-gray-500 font-serif">
              Active reader mail
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. QUICK ACTION ROW */}
      {/* ============================================================== */}
      <div className="bg-white border border-mcc-maroon/20 p-5 rounded shadow-xs">
        <h3 className="font-serif font-bold text-sm text-gray-900 uppercase tracking-wider mb-3">
          Quick Editorial Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={onOpenArticleEditor}
            className="flex items-center justify-between p-3.5 bg-mcc-halfwhite hover:bg-mcc-maroon hover:text-white border border-mcc-maroon/20 rounded transition-all group text-left"
          >
            <div>
              <span className="font-serif font-bold text-sm block group-hover:text-white text-mcc-maroon">
                Compose New Dispatch
              </span>
              <span className="text-xs text-gray-500 group-hover:text-white/80 font-sans">
                Write story or campus news
              </span>
            </div>
            <PlusCircle className="w-5 h-5 text-mcc-maroon group-hover:text-mcc-gold transition-colors flex-shrink-0" />
          </button>

          <button
            type="button"
            onClick={onOpenCircularModal}
            className="flex items-center justify-between p-3.5 bg-mcc-halfwhite hover:bg-mcc-navy hover:text-white border border-mcc-navy/20 rounded transition-all group text-left"
          >
            <div>
              <span className="font-serif font-bold text-sm block group-hover:text-white text-mcc-navy">
                Post Official Circular
              </span>
              <span className="text-xs text-gray-500 group-hover:text-white/80 font-sans">
                Publish gazette or academic memo
              </span>
            </div>
            <Bell className="w-5 h-5 text-mcc-navy group-hover:text-mcc-gold transition-colors flex-shrink-0" />
          </button>

          <button
            type="button"
            onClick={onOpenGalleryModal}
            className="flex items-center justify-between p-3.5 bg-mcc-halfwhite hover:bg-emerald-900 hover:text-white border border-emerald-900/20 rounded transition-all group text-left"
          >
            <div>
              <span className="font-serif font-bold text-sm block group-hover:text-white text-emerald-900">
                Upload Archival Photo
              </span>
              <span className="text-xs text-gray-500 group-hover:text-white/80 font-sans">
                Add photo to campus gallery
              </span>
            </div>
            <Sparkles className="w-5 h-5 text-emerald-900 group-hover:text-mcc-gold transition-colors flex-shrink-0" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. ACTIVITY STREAM & LEADERBOARD GRID */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Top Readership Dispatches Leaderboard */}
        <div className="lg:col-span-2 bg-white border border-mcc-maroon/20 rounded p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-mcc-maroon/15 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-mcc-gold" />
              <h3 className="font-serif font-bold text-base text-gray-900">
                Most Read Broadsheet Dispatches
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('articles')}
              className="text-xs font-serif text-mcc-maroon hover:underline font-semibold"
            >
              View All Articles →
            </button>
          </div>

          {topArticles.length === 0 ? (
            <p className="text-xs text-gray-500 font-serif italic py-6 text-center">
              No published articles recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {topArticles.map((art, idx) => (
                <div key={art.id || idx} className="py-3 flex items-start justify-between gap-3 group">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-mcc-maroon/10 text-mcc-maroon font-serif font-black text-xs flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-serif font-bold text-sm text-gray-900 group-hover:text-mcc-maroon truncate">
                        {art.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 font-sans mt-0.5">
                        <span className="font-medium text-mcc-navy">
                          {art.category_name || 'Broadsheet'}
                        </span>
                        {art.department_name && (
                          <>
                            <span>&bull;</span>
                            <span>{art.department_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded flex-shrink-0">
                    <Eye className="w-3.5 h-3.5 text-mcc-maroon" />
                    <span>{art.views_count?.toLocaleString() || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 3: Department Coverage Breakdown */}
        <div className="bg-white border border-mcc-maroon/20 rounded p-5 shadow-xs">
          <div className="border-b border-mcc-maroon/15 pb-3 mb-4 flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-gray-900">
              Department Coverage
            </h3>
            <span className="text-[10px] font-serif uppercase tracking-widest text-mcc-gold font-bold">
              Dispatch Distribution
            </span>
          </div>

          {departmentBreakdown.length === 0 ? (
            <p className="text-xs text-gray-500 font-serif italic py-6 text-center">
              No department data available.
            </p>
          ) : (
            <div className="space-y-3">
              {departmentBreakdown.slice(0, 6).map((dept) => (
                <div key={dept.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-serif font-medium text-gray-800 truncate pr-2">
                      {dept.name}
                    </span>
                    <span className="font-bold text-mcc-maroon font-sans text-[11px] flex-shrink-0">
                      {dept.article_count} {dept.article_count === 1 ? 'dispatch' : 'dispatches'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-mcc-maroon h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          overview.total_articles > 0
                            ? (dept.article_count / overview.total_articles) * 100
                            : 0
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. PHASE 6 ANALYTICS BREAKDOWN VISUALIZER (Tasks 111 & 112) */}
      {/* ============================================================== */}
      <AnalyticsVisualizer />

      {/* 6. NEWSLETTER DISPATCH MODAL (Task 105) */}
      <NewsletterCampaignModal
        isOpen={showNewsletterModal}
        onClose={() => setShowNewsletterModal(false)}
      />
    </div>
  );
}
