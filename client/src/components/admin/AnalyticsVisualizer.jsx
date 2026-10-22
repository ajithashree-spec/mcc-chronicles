import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Calendar,
  Layers,
  ArrowUpRight,
  Eye,
  FileText,
  RefreshCw,
} from 'lucide-react';
import articleService from '../../services/articleService';

export default function AnalyticsVisualizer() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBreakdown = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await articleService.getAnalyticsBreakdown();
      if (res.data?.data) {
        setData(res.data.data);
      } else if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load analytics breakdown:', err);
      setError('Unable to load monthly breakdown telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBreakdown();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-mcc-maroon/20 rounded p-6 shadow-xs animate-pulse space-y-4">
        <div className="h-5 w-48 bg-gray-200 rounded" />
        <div className="h-44 bg-gray-100 rounded" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-gray-100 rounded" />
          <div className="h-20 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-mcc-maroon/20 rounded p-6 shadow-xs text-center space-y-2">
        <p className="text-xs font-serif text-gray-500 italic">
          {error || 'No readership breakdown telemetry available.'}
        </p>
        <button
          type="button"
          onClick={fetchBreakdown}
          className="text-xs font-serif text-mcc-maroon hover:underline inline-flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      </div>
    );
  }

  const monthlyTrends = data.monthlyTrends || [];
  const categoryDistribution = data.categoryDistribution || [];

  const maxViews = Math.max(...monthlyTrends.map((m) => m.totalViews || 0), 100);
  const totalAnalyzedViews = monthlyTrends.reduce((sum, m) => sum + (m.totalViews || 0), 0);
  const peakMonth = [...monthlyTrends].sort((a, b) => (b.totalViews || 0) - (a.totalViews || 0))[0];

  return (
    <div className="bg-white border border-mcc-maroon/20 rounded-lg p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-mcc-maroon/15 pb-4">
        <div>
          <span className="text-[11px] font-serif uppercase tracking-widest text-mcc-gold font-bold flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-mcc-maroon" />
            Phase 6 Analytics Engine
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-black text-gray-900 tracking-tight">
            Readership Trends & Category Volume
          </h2>
          <p className="text-xs font-serif text-gray-600 mt-0.5">
            Longitudinal monthly audience telemetry and category allocation across published collegiate dispatches.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchBreakdown}
            className="p-1.5 text-gray-500 hover:text-mcc-maroon border border-gray-200 rounded transition-colors"
            title="Refresh breakdown"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-mcc-paper p-4 rounded border border-mcc-maroon/15 space-y-1">
          <div className="flex items-center justify-between text-xs font-serif text-gray-600">
            <span>Cumulative Views</span>
            <Eye className="w-3.5 h-3.5 text-mcc-navy" />
          </div>
          <div className="text-2xl font-serif font-black text-mcc-navy">
            {totalAnalyzedViews.toLocaleString()}
          </div>
          <span className="text-[10px] text-gray-500 font-sans">
            Logged across {monthlyTrends.length} reporting intervals
          </span>
        </div>

        <div className="bg-mcc-paper p-4 rounded border border-mcc-maroon/15 space-y-1">
          <div className="flex items-center justify-between text-xs font-serif text-gray-600">
            <span>Peak Circulation</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <div className="text-2xl font-serif font-black text-mcc-maroon">
            {peakMonth?.monthLabel || 'N/A'}
          </div>
          <span className="text-[10px] text-gray-500 font-sans">
            {(peakMonth?.totalViews || 0).toLocaleString()} views • {peakMonth?.articleCount || 0} dispatches
          </span>
        </div>

        <div className="bg-mcc-paper p-4 rounded border border-mcc-maroon/15 space-y-1">
          <div className="flex items-center justify-between text-xs font-serif text-gray-600">
            <span>Active Desks</span>
            <Layers className="w-3.5 h-3.5 text-mcc-gold" />
          </div>
          <div className="text-2xl font-serif font-black text-gray-900">
            {categoryDistribution.length}
          </div>
          <span className="text-[10px] text-gray-500 font-sans">
            Categorical broadsheet verticals
          </span>
        </div>
      </div>

      {/* Two Column Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* CHART 1: MONTHLY READERSHIP TRENDS (Responsive CSS Bar Chart) */}
        <div className="p-5 bg-gray-50/70 rounded-md border border-gray-200 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <h3 className="font-serif font-bold text-sm text-mcc-navy flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-mcc-maroon" />
              Monthly Readership Volume
            </h3>
            <span className="text-[11px] font-mono text-gray-500">
              Pageviews / Month
            </span>
          </div>

          {/* Bar Chart Container */}
          <div className="h-52 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 px-1 border-b border-gray-300">
            {monthlyTrends.map((m, idx) => {
              const heightPercent = Math.max(12, Math.round(((m.totalViews || 0) / maxViews) * 100));
              return (
                <div
                  key={m.monthKey || idx}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative"
                >
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 bg-gray-900 text-white text-[10px] rounded py-1 px-2 pointer-events-none whitespace-nowrap shadow-md">
                    <p className="font-bold">{m.monthLabel}</p>
                    <p>{(m.totalViews || 0).toLocaleString()} views • {m.articleCount} articles</p>
                  </div>

                  {/* Top value badge */}
                  <span className="text-[10px] font-mono text-gray-600 mb-1 group-hover:text-mcc-maroon group-hover:font-bold">
                    {m.totalViews > 999 ? `${(m.totalViews / 1000).toFixed(1)}k` : m.totalViews}
                  </span>

                  {/* Bar */}
                  <div className="w-full max-w-[42px] bg-gray-200 rounded-t overflow-hidden flex flex-col justify-end h-full">
                    <div
                      className="w-full bg-gradient-to-t from-mcc-maroon to-red-800 rounded-t transition-all duration-700 group-hover:from-mcc-gold group-hover:to-amber-600"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>

                  {/* Label */}
                  <span className="text-[10px] font-serif text-gray-600 mt-2 truncate max-w-[50px] text-center">
                    {m.monthLabel.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] font-serif text-gray-500 italic">
            Telemetry compiled from verified HTTP dispatch reads and broadsheet article sessions.
          </p>
        </div>

        {/* CHART 2: CATEGORY VOLUME DISTRIBUTION (Distribution Progress Bars) */}
        <div className="p-5 bg-gray-50/70 rounded-md border border-gray-200 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <h3 className="font-serif font-bold text-sm text-mcc-navy flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-mcc-gold" />
              Category Coverage Allocation
            </h3>
            <span className="text-[11px] font-mono text-gray-500">
              Dispatches & Share
            </span>
          </div>

          <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
            {categoryDistribution.map((cat, idx) => (
              <div key={cat.id || idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-serif">
                  <span className="font-bold text-gray-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-mcc-maroon" />
                    {cat.name}
                  </span>
                  <span className="text-gray-600 font-sans text-[11px]">
                    <strong className="text-mcc-navy font-bold">{cat.articleCount}</strong> dispatches ({cat.percentage || 0}%)
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-mcc-maroon h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(4, cat.percentage || 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] font-serif text-gray-500 italic">
            Percentage calculated against total catalog of published collegiate dispatches.
          </p>
        </div>
      </div>
    </div>
  );
}
