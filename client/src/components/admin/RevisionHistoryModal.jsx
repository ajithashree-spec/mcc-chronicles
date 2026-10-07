import React, { useState, useEffect } from 'react';
import articleService from '../../services/articleService';
import {
  History,
  ShieldCheck,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  AlertCircle,
  X,
  ExternalLink,
} from 'lucide-react';

function formatTimestamp(dateStr) {
  if (!dateStr) return 'Genesis Edition';
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Recent';
  }
}

export default function RevisionHistoryModal({
  articleId,
  articleTitle,
  isOpen,
  onClose,
}) {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!isOpen || !articleId) return;

    let isMounted = true;
    async function loadRevisions() {
      try {
        setLoading(true);
        setError(null);
        setExpandedId(null);
        const res = await articleService.getArticleRevisions(articleId);
        if (isMounted) {
          if (res && Array.isArray(res.data)) {
            setRevisions(res.data);
          } else {
            setRevisions([]);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load article revisions:', err);
          setError(
            err.response?.data?.error ||
              'Unable to retrieve archival revision history from the ledger.'
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRevisions();

    return () => {
      isMounted = false;
    };
  }, [isOpen, articleId]);

  if (!isOpen) return null;

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-[#fbfaf8] border-2 border-mcc-maroon max-w-3xl w-full rounded-md shadow-2xl overflow-hidden font-serif flex flex-col max-h-[90vh] my-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        {/* ============================================================== */}
        {/* 1. MASTHEAD HEADER */}
        {/* ============================================================== */}
        <div className="p-5 bg-white border-b-2 border-mcc-maroon/20 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded bg-mcc-maroon text-mcc-gold flex items-center justify-center shrink-0 shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-serif uppercase tracking-widest text-mcc-maroon font-bold block">
                Collegiate Editorial Registry
              </span>
              <h2
                id="modal-headline"
                className="text-lg sm:text-xl font-serif font-black text-gray-900 leading-tight"
              >
                Editorial Snapshot Ledger & Revision Trail
              </h2>
              <p className="text-xs text-gray-600 font-serif mt-0.5 line-clamp-1">
                Archival history for:{' '}
                <span className="font-bold text-mcc-navy italic">
                  &ldquo;{articleTitle || `Article #${articleId}`}&rdquo;
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close revision viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* 2. CRYPTOGRAPHIC ACCOUNTABILITY CALLOUT */}
        {/* ============================================================== */}
        <div className="bg-amber-50/70 border-b border-amber-200/80 px-5 py-2.5 flex items-center gap-2 text-xs text-amber-900 font-serif">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Audit snapshots are cryptographically preserved for accountability.</span>
        </div>

        {/* ============================================================== */}
        {/* 3. TIMELINE BODY CONTENT */}
        {/* ============================================================== */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-16 text-center space-y-3 font-serif animate-pulse">
              <Clock className="w-8 h-8 text-mcc-gold mx-auto animate-spin" />
              <p className="text-sm font-bold text-gray-700">
                Consulting editorial archive records...
              </p>
              <p className="text-xs text-gray-500">
                Fetching cryptographic revision ledger from Tambaram gazette storage.
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded bg-red-50 border-l-4 border-red-700 text-red-900 text-xs font-serif flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-700 shrink-0" />
              <span>{error}</span>
            </div>
          ) : revisions.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white rounded border border-gray-200 p-8">
              <FileText className="w-10 h-10 text-gray-300 mx-auto" />
              <h4 className="font-serif font-bold text-base text-gray-900">
                No Prior Revisions Recorded
              </h4>
              <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
                This dispatch remains in its primary genesis version. Revisions are
                automatically catalogued whenever modifications to the headline, deck,
                or prose are published.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-mcc-maroon/20 pl-6 space-y-6 ml-4">
              {revisions.map((rev, idx) => {
                const isExpanded = expandedId === rev.id;
                const editorMonogram = (rev.editor_name || 'E')[0].toUpperCase();
                const isLatest = idx === 0;

                return (
                  <div key={rev.id} className="relative group">
                    {/* Timeline Node Marker */}
                    <div
                      className={`absolute -left-[35px] top-1.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-serif font-bold shadow-xs border-2 ${
                        isLatest
                          ? 'bg-mcc-maroon text-white border-mcc-gold'
                          : 'bg-white text-mcc-navy border-gray-300'
                      }`}
                    >
                      {editorMonogram}
                    </div>

                    {/* Revision Card */}
                    <div className="bg-white rounded border border-gray-200 shadow-2xs hover:border-mcc-maroon/40 transition-all p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-serif font-bold text-sm text-mcc-navy">
                            {rev.editor_name || 'Collegiate Editor'}
                          </span>
                          {rev.editor_email && (
                            <span className="text-[11px] text-gray-500 font-sans">
                              ({rev.editor_email})
                            </span>
                          )}
                          {isLatest && (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-sans font-bold">
                              Most Recent
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-sans">
                          <Clock className="w-3.5 h-3.5 text-mcc-gold" />
                          <span>{formatTimestamp(rev.created_at)}</span>
                        </div>
                      </div>

                      {/* Change Summary Tag Badge */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-serif tracking-wider text-gray-500 font-semibold">
                            Editorial Note:
                          </span>
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-serif font-bold text-mcc-maroon bg-mcc-maroon/10 border border-mcc-maroon/20">
                            {rev.change_summary || 'General copy modification'}
                          </span>
                        </div>

                        {/* Inspect Snapshot Toggle Button */}
                        <button
                          type="button"
                          onClick={() => toggleExpand(rev.id)}
                          className="inline-flex items-center gap-1 text-xs font-serif font-bold text-mcc-maroon hover:text-mcc-maroon-dark transition-colors"
                        >
                          <span>{isExpanded ? 'Collapse' : 'Inspect Snapshot'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Expandable Historical Snapshot Drawer */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-200 bg-mcc-halfwhite/50 p-3.5 rounded text-left space-y-3 animate-in fade-in duration-150">
                          <div>
                            <span className="text-[10px] font-serif uppercase tracking-wider text-gray-500 block font-bold">
                              Historical Headline at this Milestone
                            </span>
                            <h4 className="font-serif font-bold text-base text-gray-900 mt-0.5">
                              {rev.title}
                            </h4>
                          </div>

                          {rev.excerpt && (
                            <div>
                              <span className="text-[10px] font-serif uppercase tracking-wider text-gray-500 block font-bold">
                                Historical Deck / Excerpt
                              </span>
                              <p className="text-xs font-serif italic text-gray-700 bg-white p-2 rounded border border-gray-200 mt-0.5">
                                {rev.excerpt}
                              </p>
                            </div>
                          )}

                          <div>
                            <span className="text-[10px] font-serif uppercase tracking-wider text-gray-500 block font-bold mb-1">
                              Preserved Article Body Snapshot
                            </span>
                            <div className="max-h-56 overflow-y-auto p-3 bg-white border border-gray-200 rounded text-xs text-gray-800 leading-relaxed font-serif whitespace-pre-wrap">
                              {rev.content || 'No text recorded in snapshot body.'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* 4. MODAL FOOTER */}
        {/* ============================================================== */}
        <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between text-xs font-serif">
          <span className="text-gray-500 italic">
            Madras Christian College Broadsheet Editorial Archives
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded transition-colors"
          >
            Close Ledger
          </button>
        </div>
      </div>
    </div>
  );
}
