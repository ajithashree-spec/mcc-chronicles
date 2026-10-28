import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Bell,
  Search,
  FileDown,
  Building,
  Calendar,
  Filter,
  CheckCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  AlertCircle,
  Pin,
} from 'lucide-react';
import articleService from '../services/articleService';

const AUDIENCE_FILTERS = [
  { label: 'All Notices', value: 'all' },
  { label: 'Academic & Exams', value: 'students' },
  { label: 'Faculty & Scholars', value: 'faculty' },
  { label: 'Staff & Administration', value: 'staff' },
];



function formatDate(dateStr) {
  if (!dateStr) return 'Gazette Notice';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Gazette Notice';
  }
}

export default function CircularsExplorer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const urlAudience = searchParams.get('audience') || 'all';
  const urlDepartment = searchParams.get('dept') || '';

  const [circulars, setCirculars] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [selectedAudience, setSelectedAudience] = useState(urlAudience);
  const [selectedDept, setSelectedDept] = useState(urlDepartment);
  const [previewModal, setPreviewModal] = useState(null); // active circular object

  // Fetch departments for filter dropdown
  useEffect(() => {
    async function loadDepartments() {
      try {
        const res = await articleService.getDepartments();
        if (res.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
          setDepartments(list);
        }
      } catch (err) {
        console.error('Failed to load departments for circulars filter:', err);
      }
    }
    loadDepartments();
  }, []);

  // Fetch circulars with live filtering
  useEffect(() => {
    let isMounted = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    async function fetchCirculars() {
      setLoading(true);
      try {
        const params = {
          limit: 50,
        };
        if (selectedAudience && selectedAudience !== 'all') {
          params.target_audience = selectedAudience;
        }
        if (selectedDept) {
          params.department_id = selectedDept;
        }
        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }

        const res = await articleService.getCircularsList(params);
        if (!isMounted) return;

        if (res.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
          setCirculars(list);
        } else {
          setCirculars([]);
        }
      } catch (err) {
        console.error('Failed to load circulars list:', err);
        if (isMounted) {
          setCirculars([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCirculars();

    return () => {
      isMounted = false;
    };
  }, [selectedAudience, selectedDept, searchQuery]);

  const handleAudienceChange = (aud) => {
    setSelectedAudience(aud);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('audience', aud);
      return p;
    });
  };

  const handleDeptChange = (deptId) => {
    setSelectedDept(deptId);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (deptId) p.set('dept', deptId);
      else p.delete('dept');
      return p;
    });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (searchQuery.trim()) p.set('search', searchQuery.trim());
      else p.delete('search');
      return p;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 animate-in fade-in duration-300">
      {/* 1. BREADCRUMB */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-serif text-gray-500 mb-6">
        <Link to="/" className="hover:text-mcc-maroon transition-colors">
          Home
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-mcc-maroon font-bold font-serif">Academic Gazette & Circulars</span>
      </nav>

      {/* 2. GRAND INSTITUTIONAL HEADER */}
      <header className="mb-10 pb-4 border-b-2 border-mcc-navy flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-serif uppercase tracking-widest text-mcc-gold font-bold block mb-1">
            Office of the Principal & Controller of Examinations
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-gray-950 uppercase tracking-tight">
            Official Gazette & Academic Circulars
          </h1>
          <p className="text-sm sm:text-base font-serif italic text-gray-700 mt-2 max-w-2xl leading-relaxed">
            The institutional record for curricular directives, examination schedules, administrative memorandums, and student announcements.
          </p>
        </div>

        <div className="md:text-right shrink-0">
          <span className="text-xs font-serif uppercase tracking-widest font-bold text-gray-600 block">
            Official Gazette Registry
          </span>
          <span className="text-xs font-sans text-mcc-navy font-semibold">
            {circulars.length} {circulars.length === 1 ? 'Notice' : 'Notices'} in Current Register
          </span>
        </div>
      </header>

      {/* 3. FILTERS & SEARCH TOOLBAR */}
      <div className="bg-white p-5 rounded-md border border-gray-200 shadow-xs mb-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* SEARCH INPUT */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search circulars by title, reference number, or keyword..."
              className="w-full pl-10 pr-20 py-2.5 bg-mcc-paper/30 border border-gray-300 focus:border-mcc-navy focus:ring-1 focus:ring-mcc-navy rounded text-xs sm:text-sm font-sans text-gray-900 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-mcc-navy text-white text-xs font-serif font-bold uppercase tracking-wider rounded hover:bg-black transition-colors"
            >
              Filter
            </button>
          </form>

          {/* DEPARTMENT DROPDOWN */}
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-mcc-gold shrink-0" />
            <select
              value={selectedDept}
              onChange={(e) => handleDeptChange(e.target.value)}
              className="px-3 py-2 bg-mcc-paper/40 border border-gray-300 rounded text-xs font-serif text-gray-800 focus:outline-hidden focus:border-mcc-navy"
            >
              <option value="">ALL DEPARTMENTS</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* AUDIENCE PILL BUTTONS */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 flex-wrap">
          <span className="text-xs font-serif font-bold uppercase tracking-wider text-gray-500 mr-2 flex items-center gap-1">
            <Filter className="w-3 h-3 text-mcc-gold" />
            Target:
          </span>
          {AUDIENCE_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => handleAudienceChange(item.value)}
              className={`px-3 py-1 rounded-full text-xs font-serif transition-colors border ${
                selectedAudience === item.value
                  ? 'bg-mcc-navy text-white border-mcc-navy font-semibold'
                  : 'bg-white hover:bg-mcc-paper text-gray-700 border-gray-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. CIRCULARS TABLE / CARD STREAM */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white p-5 rounded border border-gray-200 animate-pulse space-y-3">
              <div className="h-4 w-40 bg-gray-200 rounded" />
              <div className="h-6 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : circulars.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-md border border-dashed border-gray-300 max-w-xl mx-auto">
          <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-gray-800">
            No Circulars Match Selected Filters
          </h3>
          <p className="text-xs font-serif text-gray-600 mt-1">
            Try adjusting your search keywords or resetting the department and audience filters.
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedAudience('all');
                setSelectedDept('');
                setSearchParams({});
              }}
              className="px-4 py-1.5 bg-mcc-navy text-white text-xs font-serif font-bold uppercase tracking-wider rounded hover:bg-black transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {circulars.map((circ) => {
            const isPinned = circ.is_pinned === 1 || circ.is_pinned === true;
            return (
              <div
                key={circ.id}
                className={`p-5 bg-white rounded-md border transition-all hover:shadow-xs group flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                  isPinned
                    ? 'border-mcc-gold/60 bg-mcc-gold/5'
                    : 'border-gray-200 hover:border-mcc-navy/40'
                }`}
              >
                <div className="space-y-2 flex-1">
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {isPinned && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-mcc-gold text-white text-[10px] font-serif uppercase tracking-widest font-bold rounded">
                        <Pin className="w-3 h-3 fill-current" />
                        Important Notice
                      </span>
                    )}

                    <span className="font-mono text-xs font-bold text-mcc-navy bg-white px-2.5 py-0.5 rounded border border-mcc-navy/20 shadow-2xs">
                      {circ.circular_number}
                    </span>

                    <span className="text-gray-400">•</span>

                    <span className="text-gray-600 font-sans text-xs flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-mcc-gold" />
                      {formatDate(circ.publish_date)}
                    </span>

                    <span className="text-gray-400">•</span>

                    <span className="text-xs font-serif capitalize text-gray-500">
                      Target: <strong className="text-gray-700">{circ.target_audience || 'All'}</strong>
                    </span>
                  </div>

                  {/* Headline */}
                  <h3
                    onClick={() => setPreviewModal(circ)}
                    className="font-serif text-lg sm:text-xl font-bold text-gray-900 group-hover:text-mcc-navy transition-colors cursor-pointer leading-snug"
                  >
                    {circ.title}
                  </h3>

                  {/* Issuing Authority / Excerpt */}
                  <p className="text-xs text-gray-600 font-sans line-clamp-2 leading-relaxed">
                    {circ.content || 'Official campus notification from Madras Christian College.'}
                  </p>

                  <div className="text-[11px] font-sans text-gray-500 flex items-center gap-1 pt-1">
                    <Building className="w-3 h-3 text-mcc-gold" />
                    <span>Issuing Body: {circ.department_name || 'Central Administration'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewModal(circ)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-serif font-bold uppercase tracking-wider bg-white hover:bg-mcc-paper text-mcc-navy border border-gray-300 hover:border-mcc-navy transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Text</span>
                  </button>

                  {circ.attachment_url ? (
                    <a
                      href={circ.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-serif font-bold uppercase tracking-wider bg-mcc-navy hover:bg-black text-white transition-colors shadow-2xs"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPreviewModal(circ)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-serif font-bold uppercase tracking-wider bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                    >
                      <span>Full Notice</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. CIRCULAR PREVIEW MODAL */}
      {previewModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewModal(null);
          }}
        >
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl border border-mcc-navy/20 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            {/* MODAL HEADER */}
            <div className="px-6 py-4 border-b border-gray-200 bg-mcc-paper flex items-center justify-between">
              <div>
                <span className="text-[10px] font-serif uppercase tracking-widest text-mcc-gold font-bold block">
                  The Madras Christian College Gazette
                </span>
                <span className="font-mono text-xs font-bold text-mcc-navy">
                  Ref: {previewModal.circular_number}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModal(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-6 overflow-y-auto space-y-4">
              <h2 className="font-serif text-2xl font-bold text-gray-950 leading-tight">
                {previewModal.title}
              </h2>

              <div className="flex flex-wrap items-center gap-3 text-xs font-sans text-gray-600 border-y border-gray-100 py-2.5">
                <span>Date: <strong>{formatDate(previewModal.publish_date)}</strong></span>
                <span>•</span>
                <span>Issuing: <strong>{previewModal.department_name || 'Administration'}</strong></span>
                <span>•</span>
                <span>Audience: <strong className="capitalize">{previewModal.target_audience || 'All'}</strong></span>
              </div>

              <div className="font-serif text-gray-800 leading-relaxed text-sm whitespace-pre-line pt-2">
                {previewModal.content}
              </div>

              <div className="pt-4 border-t border-gray-100 text-xs font-serif text-gray-500 italic">
                Issued with the approval of the competent collegiate authority. Certified archival copy from the MCC Gazette.
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 border border-gray-300 rounded text-xs font-serif text-gray-700 hover:bg-white"
              >
                Print Notice
              </button>
              <div className="flex items-center gap-2">
                {previewModal.attachment_url && (
                  <a
                    href={previewModal.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-mcc-navy text-white text-xs font-serif font-bold uppercase tracking-wider rounded hover:bg-black transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewModal(null)}
                  className="px-4 py-1.5 bg-gray-200 text-gray-800 text-xs font-serif font-semibold rounded hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
