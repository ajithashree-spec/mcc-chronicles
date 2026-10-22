import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import articleService from '../services/articleService';
import {
  Building2,
  GraduationCap,
  Mail,
  UserCheck,
  Search,
  Filter,
  ArrowRight,
  BookOpen,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Clock,
  Compass,
} from 'lucide-react';

const STREAM_CATEGORIES = {
  All: ['Aided', 'Self-Financed', 'General'],
  Arts: ['English', 'History', 'Economics', 'Philosophy', 'Political Science', 'Tamil'],
  Sciences: ['Physics', 'Chemistry', 'Botany', 'Zoology', 'Mathematics', 'Statistics', 'Computer Science'],
  Commerce: ['Commerce', 'Business Administration', 'Corporate Secretaryship', 'Accounting'],
};

export default function DepartmentDirectory() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [activeStream, setActiveStream] = useState('All'); // 'All' | 'Arts' | 'Sciences' | 'Commerce'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function fetchDepartments() {
      try {
        setLoading(true);
        setError(null);
        const res = await articleService.getDepartments();
        if (isMounted) {
          const list = Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data)
            ? res.data
            : [];
          setDepartments(list);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load departments directory:', err);
          setError('Unable to retrieve collegiate department registry from archives.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDepartments();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter departments based on stream category and search query
  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch =
      dept.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.head_of_department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.description?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeStream === 'All') return true;

    if (activeStream === 'Aided') return dept.stream === 'Aided';
    if (activeStream === 'Self-Financed') return dept.stream === 'Self-Financed';

    // Faculty-based categorization check
    const streamKeywords = STREAM_CATEGORIES[activeStream] || [];
    const deptName = dept.name || '';
    return streamKeywords.some((keyword) =>
      deptName.toLowerCase().includes(keyword.toLowerCase())
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8 font-serif animate-in fade-in duration-300">
      {/* 1. BREADCRUMB */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-500">
        <Link to="/" className="hover:text-mcc-maroon transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-gray-400">Institutional Bureaus</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-mcc-maroon font-bold">Academic Departments</span>
      </nav>

      {/* 2. GRAND BROADSHEET MASTHEAD BANNER */}
      <div className="border-b-2 border-mcc-maroon pb-6">
        <div className="flex items-center gap-2 text-mcc-gold text-xs uppercase tracking-widest font-bold mb-1">
          <Building2 className="w-4 h-4 text-mcc-maroon" />
          <span>Madras Christian College Faculty of Arts, Sciences & Commerce</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
          Collegiate Academic Departments & Editorial Bureaus
        </h1>
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-600">
          <p className="max-w-2xl leading-relaxed">
            Founded 1837 in George Town and relocated to the 365-acre Tambaram scrub sanctuary in
            1937. Official departmental liaison desks coordinating scholarly research and campus dispatches.
          </p>
          <span className="font-bold text-mcc-maroon whitespace-nowrap bg-mcc-maroon/5 px-2.5 py-1 rounded border border-mcc-maroon/10">
            {departments.length} Institutional Bureaus Indexed
          </span>
        </div>
      </div>

      {/* 3. SEARCH & STREAM FILTER ROW */}
      <div className="bg-white border border-mcc-maroon/20 p-4 sm:p-5 rounded-md shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Stream Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 text-xs font-bold">
            {[
              { id: 'All', label: 'All Bureaus' },
              { id: 'Aided', label: 'Aided (Shift I)' },
              { id: 'Self-Financed', label: 'Self-Financed (Shift II)' },
              { id: 'Arts', label: 'Faculty of Arts' },
              { id: 'Sciences', label: 'Faculty of Sciences' },
              { id: 'Commerce', label: 'Faculty of Commerce' },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveStream(id)}
                className={`px-3.5 py-1.5 rounded transition-all whitespace-nowrap uppercase tracking-wider text-xs ${
                  activeStream === id
                    ? 'bg-mcc-maroon text-white shadow-xs font-bold'
                    : 'bg-mcc-halfwhite/80 text-gray-700 hover:bg-mcc-maroon/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by department name or code..."
              className="w-full pl-9 pr-4 py-2 text-xs font-serif border border-gray-300 rounded focus:border-mcc-maroon focus:ring-1 focus:ring-mcc-maroon outline-none"
            />
          </div>
        </div>
      </div>

      {/* 4. ERROR NOTICE */}
      {error && (
        <div className="p-4 rounded bg-red-50 border-l-4 border-red-700 text-red-900 text-xs flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      {/* 5. DEPARTMENT CARDS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-64 bg-gray-200 rounded-md" />
          ))}
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-white rounded border border-mcc-maroon/20 p-8">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-xl font-bold text-gray-900">
            No Academic Departments Found
          </h3>
          <p className="text-xs text-gray-600 max-w-md mx-auto">
            No departments match your filter or search query. Try switching faculties or clear search terms.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveStream('All');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-mcc-maroon text-white font-bold text-xs uppercase tracking-wider rounded hover:bg-mcc-maroon-dark transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepartments.map((dept) => {
            const fallbackEmail = `${(dept.code || 'acad').toLowerCase()}@mcc.edu.in`;
            const contactEmail = dept.contact_email || fallbackEmail;
            const hod = dept.head_of_department || 'Department Head & Academic Dean';
            const streamBadge = dept.stream || 'Aided';

            return (
              <div
                key={dept.id}
                className="bg-white rounded-md border-2 border-gray-200 hover:border-mcc-maroon/60 transition-all hover:shadow-md flex flex-col justify-between overflow-hidden group"
              >
                {/* Department Header Stamping */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-mcc-maroon/10 text-mcc-maroon flex items-center justify-center font-bold text-xs shrink-0">
                        {dept.code || 'MCC'}
                      </div>
                      <span className="font-mono text-xs text-mcc-gold font-bold">
                        CODE: {dept.code || 'ACAD'}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase tracking-wider ${
                        streamBadge === 'Aided'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-purple-50 text-purple-800 border border-purple-200'
                      }`}
                    >
                      {streamBadge}
                    </span>
                  </div>

                  {/* Department Title */}
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-mcc-maroon transition-colors leading-snug">
                    {dept.name}
                  </h3>

                  {/* Dean / HOD Notice */}
                  <div className="space-y-1.5 pt-1 text-xs text-gray-600">
                    <div className="flex items-start gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-mcc-gold shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                          Dean / Head of Department
                        </span>
                        <span className="font-semibold text-gray-800">{hod}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Mail className="w-3.5 h-3.5 text-mcc-maroon shrink-0" />
                      <span className="text-[11px] font-sans text-gray-600 truncate">
                        {contactEmail}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-500 font-sans">
                      <Compass className="w-3.5 h-3.5 text-mcc-navy shrink-0" />
                      <span>Student Bureau & Correspondent Liaison Active</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Card */}
                <div className="p-4 bg-mcc-halfwhite/60 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-gray-500 font-sans">
                    {dept.member_count !== undefined
                      ? `${dept.member_count} Faculty Fellows`
                      : 'Editorial Bureau'}
                  </span>

                  <Link
                    to={`/category/campus-news?dept=${dept.id}`}
                    className="inline-flex items-center gap-1 font-bold text-mcc-maroon group-hover:text-mcc-maroon-dark uppercase tracking-wider text-[11px] transition-colors"
                  >
                    <span>Department Dispatches</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
