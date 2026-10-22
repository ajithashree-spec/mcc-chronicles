import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Menu,
  X,
  LayoutDashboard,
  Calendar,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import SearchModal from '../search/SearchModal';
import articleService from '../../services/articleService';

// Fallback Authentic 17 Aided Stream Departments (Shift I)
const AIDED_DEPARTMENTS_STATIC = [
  { name: 'English', code: 'ENG-AID', slug: 'eng-aid' },
  { name: 'Tamil', code: 'TAM-AID', slug: 'tam-aid' },
  { name: 'Languages', code: 'LANG-AID', slug: 'lang-aid' },
  { name: 'History', code: 'HIST-AID', slug: 'hist-aid' },
  { name: 'Political Science', code: 'POL-AID', slug: 'pol-aid' },
  { name: 'Public Administration', code: 'PUB-AID', slug: 'pub-aid' },
  { name: 'Economics', code: 'ECO-AID', slug: 'eco-aid' },
  { name: 'Philosophy', code: 'PHIL-AID', slug: 'phil-aid' },
  { name: 'Commerce', code: 'COM-AID', slug: 'com-aid' },
  { name: 'Social Work', code: 'SOW-AID', slug: 'sow-aid' },
  { name: 'Mathematics', code: 'MATH-AID', slug: 'math-aid' },
  { name: 'Statistics', code: 'STAT-AID', slug: 'stat-aid' },
  { name: 'Physics', code: 'PHY-AID', slug: 'phy-aid' },
  { name: 'Chemistry', code: 'CHEM-AID', slug: 'chem-aid' },
  { name: 'Plant Biology & Plant Biotechnology', code: 'BOT-AID', slug: 'bot-aid' },
  { name: 'Zoology', code: 'ZOO-AID', slug: 'zoo-aid' },
  { name: 'Physical Education', code: 'PED-AID', slug: 'ped-aid' },
];

// Fallback Authentic 21 Self-Financed Stream Departments (Shift II)
const SFS_DEPARTMENTS_STATIC = [
  { name: 'English (SFS)', code: 'ENG-SFS', slug: 'eng-sfs' },
  { name: 'Tamil (SFS)', code: 'TAM-SFS', slug: 'tam-sfs' },
  { name: 'Languages (SFS)', code: 'LANG-SFS', slug: 'lang-sfs' },
  { name: 'Journalism', code: 'JRN-SFS', slug: 'jrn-sfs' },
  { name: 'Social Work (SFS)', code: 'SOW-SFS', slug: 'sow-sfs' },
  { name: 'Commerce (SFS)', code: 'COM-SFS', slug: 'com-sfs' },
  { name: 'Business Administration (BBA)', code: 'BBA-SFS', slug: 'bba-sfs' },
  { name: 'Communication', code: 'COMM-SFS', slug: 'comm-sfs' },
  { name: 'Geography Tourism & Travel Management', code: 'GTTM-SFS', slug: 'gttm-sfs' },
  { name: 'Hospitality & Tourism', code: 'HTM-SFS', slug: 'htm-sfs' },
  { name: 'Mathematics (SFS)', code: 'MATH-SFS', slug: 'math-sfs' },
  { name: 'Physics (SFS)', code: 'PHY-SFS', slug: 'phy-sfs' },
  { name: 'Chemistry (SFS)', code: 'CHEM-SFS', slug: 'chem-sfs' },
  { name: 'Microbiology', code: 'MCB-SFS', slug: 'mcb-sfs' },
  { name: 'Computer Application (BCA)', code: 'BCA-SFS', slug: 'bca-sfs' },
  { name: 'Computer Science (B.Sc.)', code: 'CS-BSC-SFS', slug: 'cs-bsc-sfs' },
  { name: 'Computer Science (MCA)', code: 'CS-MCA-SFS', slug: 'cs-mca-sfs' },
  { name: 'Data Science', code: 'DS-SFS', slug: 'ds-sfs' },
  { name: 'Visual Communication', code: 'VISCOM-SFS', slug: 'viscom-sfs' },
  { name: 'Physical Education Health Education & Sports', code: 'PED-SFS', slug: 'ped-sfs' },
  { name: 'Psychology', code: 'PSY-SFS', slug: 'psy-sfs' },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Multi-tier Desktop Dropdown state
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const [activeStream, setActiveStream] = useState(null); // 'aided' | 'sfs' | null
  const deptRef = useRef(null);
  const dropdownTimeoutRef = useRef(null);

  // Mobile Accordion state
  const [mobileDeptOpen, setMobileDeptOpen] = useState(false);
  const [mobileAidedOpen, setMobileAidedOpen] = useState(false);
  const [mobileSfsOpen, setMobileSfsOpen] = useState(false);

  // Dynamic Departments from backend
  const [dbAided, setDbAided] = useState([]);
  const [dbSfs, setDbSfs] = useState([]);

  // Accessibility Font Size Toggle
  const [largeText, setLargeText] = useState(false);

  // Dynamic formatted date
  const [currentDateStr, setCurrentDateStr] = useState('');

  useEffect(() => {
    if (largeText) {
      document.documentElement.classList.add('large-text');
    } else {
      document.documentElement.classList.remove('large-text');
    }
  }, [largeText]);

  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    setCurrentDateStr(formatted);
  }, []);

  // Fetch departments dynamically from API
  useEffect(() => {
    let isMounted = true;
    articleService
      .getDepartments()
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];
        if (list.length > 0) {
          const aided = list.filter((d) => d.stream === 'Aided');
          const sfs = list.filter((d) => d.stream === 'Self-Financed');
          if (aided.length > 0) setDbAided(aided);
          if (sfs.length > 0) setDbSfs(sfs);
        }
      })
      .catch((err) => {
        console.warn('Departments live fetch fallback:', err.message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setDeptDropdownOpen(false);
    setActiveStream(null);
  }, [location.pathname]);

  // Handle click outside and Escape key to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (deptRef.current && !deptRef.current.contains(event.target)) {
        setDeptDropdownOpen(false);
        setActiveStream(null);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setDeptDropdownOpen(false);
        setActiveStream(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Dropdown hover handling with grace debounce
  const handleDropdownEnter = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setDeptDropdownOpen(true);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setDeptDropdownOpen(false);
      setActiveStream(null);
    }, 180);
  };

  // Compile final departments lists
  const aidedList =
    dbAided.length > 0
      ? dbAided.map((d) => ({
          name: d.name.replace(/^Department of\s+/i, ''),
          code: d.code,
          slug: (d.code || d.name).toLowerCase().replace(/[\s()&,]+/g, '-'),
          id: d.id,
        }))
      : AIDED_DEPARTMENTS_STATIC;

  const sfsList =
    dbSfs.length > 0
      ? dbSfs.map((d) => ({
          name: d.name.replace(/^Department of\s+/i, ''),
          code: d.code,
          slug: (d.code || d.name).toLowerCase().replace(/[\s()&,]+/g, '-'),
          id: d.id,
        }))
      : SFS_DEPARTMENTS_STATIC;

  return (
    <header className="w-full sticky top-0 z-50 shadow-md">
      {/* 1. SLIM INSTITUTIONAL UTILITY BAR (Dark Midnight Navy #0F2537, Strictly Read-Only) */}
      <div className="bg-[#0F2537] border-b border-[#C5A059]/30 text-xs py-1.5 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Left: Date & Accreditation */}
          <div className="flex items-center gap-3 text-[#FAF8F5] text-[11px]">
            <span className="flex items-center gap-1.5 text-[#FAF8F5] font-semibold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
              {currentDateStr || 'Wednesday, October 14, 2026'}
            </span>
            <span className="hidden md:inline text-[#C5A059]">•</span>
            <span className="hidden md:inline text-[#FAF8F5]/80 font-medium">
              Autonomous Institution &bull; Affiliated to University of Madras &bull; NAAC A++
            </span>
          </div>

          {/* Right: Circulars & Accessibility */}
          <div className="flex items-center gap-3 text-[11px] text-[#FAF8F5]">
            <Link
              to="/circulars"
              className="text-[#FAF8F5] hover:text-[#C5A059] transition-colors font-medium hidden sm:inline"
            >
              Circulars
            </Link>

            {/* Accessibility Font Size Toggle */}
            <div
              className="flex items-center gap-0.5 border border-[#C5A059]/40 rounded px-1 py-0.5 text-[10px] font-serif bg-[#0A1926] shadow-2xs ml-1"
              title="Adjust Reader Text Size"
            >
              <button
                type="button"
                onClick={() => setLargeText(false)}
                className={`px-1.5 py-0.2 rounded transition-colors ${
                  !largeText
                    ? 'bg-[#C5A059] text-[#0F2537] font-bold'
                    : 'text-[#FAF8F5]/80 hover:text-[#C5A059]'
                }`}
                title="Standard Text Size"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setLargeText(true)}
                className={`px-1.5 py-0.2 rounded transition-colors ${
                  largeText
                    ? 'bg-[#C5A059] text-[#0F2537] font-bold'
                    : 'text-[#FAF8F5]/80 hover:text-[#C5A059]'
                }`}
                title="Large Text Size"
              >
                A+
              </button>
            </div>

            {/* Authenticated Staff Indicator (ONLY visible if session already authenticated; zero login CTAs exposed publicly) */}
            {isAuthenticated() && (
              <>
                <span className="text-[#C5A059]">•</span>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1 px-2 py-0.5 bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/40 font-semibold rounded hover:bg-[#C5A059] hover:text-[#0F2537] transition-colors"
                  title="Editorial Dashboard"
                >
                  <LayoutDashboard className="w-3 h-3 text-[#C5A059]" />
                  <span>Dashboard ({user?.name ? user.name.split(' ')[0] : 'Staff'})</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. SOLID DEEP INSTITUTIONAL MAROON HEADER BAR (#581A20 + Gold Band) */}
      <div className="bg-[#581A20] border-b-4 border-[#C5A059] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* LEFT: MCC Crest & Institutional Brand Title */}
            <Link
              to="/"
              className="group flex items-center gap-3 shrink-0 py-1"
              title="Madras Christian College - Campus News Portal"
            >
              <img
                src="/assets/mcc-crest.png"
                alt="Madras Christian College Crest"
                className="h-11 sm:h-13 w-auto object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-sm brightness-105"
              />
              <div className="flex flex-col justify-center">
                <span className="font-serif font-bold text-xl sm:text-2xl text-[#FAF8F5] tracking-tight leading-none group-hover:text-[#C5A059] transition-colors">
                  Madras Christian College
                </span>
                <span className="text-[10px] sm:text-[11px] font-sans font-bold tracking-[0.25em] text-[#C5A059] uppercase block mt-1">
                  CAMPUS NEWS PORTAL
                </span>
              </div>
            </Link>

            {/* CENTER: SIMPLIFIED 3-ITEM PRIMARY NAVIGATION (Desktop) */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-4">
              {/* 1. Home */}
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `px-3 py-2 flex items-center gap-1.5 font-sans font-semibold text-xs sm:text-sm tracking-wider uppercase transition-colors duration-150 ${
                    isActive
                      ? 'text-[#C5A059] border-b-2 border-[#C5A059] font-bold'
                      : 'text-[#FAF8F5]/90 hover:text-[#C5A059]'
                  }`
                }
              >
                Home
              </NavLink>

              {/* 2. Campus News */}
              <NavLink
                to="/news"
                className={({ isActive }) =>
                  `px-3 py-2 flex items-center gap-1.5 font-sans font-semibold text-xs sm:text-sm tracking-wider uppercase transition-colors duration-150 ${
                    isActive || location.pathname.startsWith('/category/campus-news')
                      ? 'text-[#C5A059] border-b-2 border-[#C5A059] font-bold'
                      : 'text-[#FAF8F5]/90 hover:text-[#C5A059]'
                  }`
                }
              >
                Campus News
              </NavLink>

              {/* 3. Departments (Interactive Multi-Tier Cascading Dropdown) */}
              <div
                className="relative"
                ref={deptRef}
                onMouseEnter={handleDropdownEnter}
                onMouseLeave={handleDropdownLeave}
              >
                <button
                  type="button"
                  onClick={() => setDeptDropdownOpen((prev) => !prev)}
                  className={`px-3 py-2 flex items-center gap-1.5 font-sans font-semibold text-xs sm:text-sm tracking-wider uppercase transition-colors duration-150 cursor-pointer ${
                    deptDropdownOpen || location.pathname.startsWith('/departments')
                      ? 'text-[#C5A059] border-b-2 border-[#C5A059] font-bold'
                      : 'text-[#FAF8F5]/90 hover:text-[#C5A059]'
                  }`}
                  aria-expanded={deptDropdownOpen}
                  aria-haspopup="true"
                >
                  <span>Departments</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      deptDropdownOpen ? 'rotate-180 text-[#C5A059]' : 'text-inherit'
                    }`}
                  />
                </button>

                {/* LEVEL 1 STREAM DROPDOWN (Cream Half-White Canvas, Double Gold Border, Z-50) */}
                {deptDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 min-w-[260px] bg-[#FAF8F5] border-2 border-[#C5A059] shadow-2xl rounded-md z-50 p-2 font-serif text-xs animate-in fade-in zoom-in-95 duration-150 text-[#0F2537]">
                    <div className="px-3 py-1.5 border-b border-[#C5A059]/30 text-[10px] font-sans font-bold uppercase tracking-wider text-[#581A20]">
                      Academic Streams
                    </div>

                    {/* Aided Stream (Shift I) Option */}
                    <div
                      className="relative"
                      onMouseEnter={() => setActiveStream('aided')}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveStream((prev) => (prev === 'aided' ? null : 'aided'))}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-sm transition-colors duration-150 text-left group cursor-pointer ${
                          activeStream === 'aided'
                            ? 'bg-[#581A20] text-[#FAF8F5] font-bold shadow-xs'
                            : 'text-[#0F2537] hover:bg-[#581A20] hover:text-[#FAF8F5]'
                        }`}
                      >
                        <div>
                          <span className="block font-bold text-xs">Aided Stream (Shift I)</span>
                          <span
                            className={`text-[10px] font-sans block ${
                              activeStream === 'aided' ? 'text-[#C5A059]' : 'text-gray-500 group-hover:text-[#FAF8F5]/80'
                            }`}
                          >
                            17 Academic Departments
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-75" />
                      </button>

                      {/* LEVEL 2 FLYOUT: AIDED SUB-MENU (17 Departments) */}
                      {activeStream === 'aided' && (
                        <div className="absolute left-full top-0 ml-1 w-80 sm:w-88 max-h-[70vh] bg-[#FAF8F5] border-2 border-[#C5A059] shadow-2xl rounded-md p-2 z-50 animate-in fade-in slide-in-from-left-1 duration-150 text-[#0F2537]">
                          <div className="pb-2 mb-2 border-b border-[#C5A059]/30 flex items-center justify-between px-1">
                            <span className="font-bold text-[#581A20] text-xs uppercase tracking-wide">
                              Aided Stream &bull; 17 Departments
                            </span>
                            <span className="text-[10px] font-sans bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                              Shift I
                            </span>
                          </div>

                          <div className="max-h-[65vh] overflow-y-auto scrollbar-thin space-y-0.5 pr-1">
                            {aidedList.map((dept) => (
                              <Link
                                key={dept.slug}
                                to={`/departments/${dept.slug}`}
                                onClick={() => {
                                  setDeptDropdownOpen(false);
                                  setActiveStream(null);
                                }}
                                className="px-3 py-1.5 rounded text-xs font-semibold text-[#0F2537] hover:bg-[#581A20] hover:text-[#FAF8F5] transition-colors duration-150 flex items-center justify-between group"
                              >
                                <span className="truncate pr-2">
                                  {dept.name}
                                </span>
                                <span className="font-mono text-[9px] text-[#C5A059] group-hover:text-[#FAF8F5] uppercase shrink-0">
                                  {dept.code}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Self-Financed Stream (Shift II) Option */}
                    <div
                      className="relative mt-1"
                      onMouseEnter={() => setActiveStream('sfs')}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveStream((prev) => (prev === 'sfs' ? null : 'sfs'))}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-sm transition-colors duration-150 text-left group cursor-pointer ${
                          activeStream === 'sfs'
                            ? 'bg-[#581A20] text-[#FAF8F5] font-bold shadow-xs'
                            : 'text-[#0F2537] hover:bg-[#581A20] hover:text-[#FAF8F5]'
                        }`}
                      >
                        <div>
                          <span className="block font-bold text-xs">Self-Financed Stream (Shift II)</span>
                          <span
                            className={`text-[10px] font-sans block ${
                              activeStream === 'sfs' ? 'text-[#C5A059]' : 'text-gray-500 group-hover:text-[#FAF8F5]/80'
                            }`}
                          >
                            21 Academic Departments
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-75" />
                      </button>

                      {/* LEVEL 2 FLYOUT: SELF-FINANCED SUB-MENU (21 Departments with smooth scrollbar-thin) */}
                      {activeStream === 'sfs' && (
                        <div className="absolute left-full top-0 ml-1 w-80 sm:w-96 max-h-[70vh] bg-[#FAF8F5] border-2 border-[#C5A059] shadow-2xl rounded-md p-2 z-50 animate-in fade-in slide-in-from-left-1 duration-150 text-[#0F2537]">
                          <div className="pb-2 mb-2 border-b border-[#C5A059]/30 flex items-center justify-between px-1">
                            <span className="font-bold text-[#581A20] text-xs uppercase tracking-wide">
                              Self-Financed &bull; 21 Departments
                            </span>
                            <span className="text-[10px] font-sans bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-semibold">
                              Shift II
                            </span>
                          </div>

                          <div className="max-h-[65vh] overflow-y-auto scrollbar-thin space-y-0.5 pr-1">
                            {sfsList.map((dept) => (
                              <Link
                                key={dept.slug}
                                to={`/departments/${dept.slug}`}
                                onClick={() => {
                                  setDeptDropdownOpen(false);
                                  setActiveStream(null);
                                }}
                                className="px-3 py-1.5 rounded text-xs font-semibold text-[#0F2537] hover:bg-[#581A20] hover:text-[#FAF8F5] transition-colors duration-150 flex items-center justify-between group"
                              >
                                <span className="truncate pr-2">
                                  {dept.name}
                                </span>
                                <span className="font-mono text-[9px] text-[#C5A059] group-hover:text-[#FAF8F5] uppercase shrink-0">
                                  {dept.code}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* All Departments Directory Link */}
                    <div className="mt-2 pt-2 border-t border-[#C5A059]/30">
                      <Link
                        to="/departments"
                        onClick={() => {
                          setDeptDropdownOpen(false);
                          setActiveStream(null);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-[#581A20] hover:bg-[#581A20] hover:text-[#FAF8F5] rounded transition-colors"
                      >
                        <span>All 38 Department Bureaus Directory</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* RIGHT: Action Tools (Search Modal & Mobile Trigger) */}
            <div className="flex items-center space-x-2">
              {/* Search Trigger */}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase font-semibold text-[#FAF8F5] hover:text-[#C5A059] hover:bg-black/20 border border-[#C5A059]/40 bg-[#0F2537]/70 rounded-md transition-colors"
                aria-label="Search Dispatches"
              >
                <Search className="w-3.5 h-3.5 text-[#C5A059]" />
                <span className="hidden sm:inline font-sans">Search</span>
              </button>

              {/* Mobile Hamburger Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-[#FAF8F5] hover:text-[#C5A059] hover:bg-black/20 focus:outline-none"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. GLOBAL SEARCH MODAL */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* 5. MOBILE ACCORDION NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-[#C5A059] bg-[#0F2537] px-4 pt-3 pb-6 space-y-2 shadow-2xl animate-in slide-in-from-top-2 max-w-full overflow-hidden text-[#FAF8F5]">
          {/* Home */}
          <NavLink
            to="/"
            end
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 text-sm font-serif font-bold rounded-md transition-colors ${
                isActive
                  ? 'bg-[#581A20] text-[#FAF8F5] border-l-4 border-[#C5A059]'
                  : 'text-[#FAF8F5] hover:text-[#C5A059] hover:bg-white/5'
              }`
            }
          >
            <span>Home</span>
            <ChevronRight className="w-4 h-4 opacity-75 text-[#C5A059]" />
          </NavLink>

          {/* Campus News */}
          <NavLink
            to="/news"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 text-sm font-serif font-bold rounded-md transition-colors ${
                isActive || location.pathname.startsWith('/category/campus-news')
                  ? 'bg-[#581A20] text-[#FAF8F5] border-l-4 border-[#C5A059]'
                  : 'text-[#FAF8F5] hover:text-[#C5A059] hover:bg-white/5'
              }`
            }
          >
            <span>Campus News</span>
            <ChevronRight className="w-4 h-4 opacity-75 text-[#C5A059]" />
          </NavLink>

          {/* Departments Accordion */}
          <div className="border border-[#C5A059]/40 rounded-md overflow-hidden bg-[#FAF8F5] text-[#0F2537]">
            <button
              type="button"
              onClick={() => setMobileDeptOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-serif font-bold text-[#0F2537] bg-[#FAF8F5]"
            >
              <div className="flex items-center gap-2">
                <span>Departments</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  mobileDeptOpen ? 'rotate-180 text-[#581A20]' : 'text-gray-400'
                }`}
              />
            </button>

            {mobileDeptOpen && (
              <div className="p-2 space-y-2 border-t border-[#C5A059]/30 bg-[#FAF8F5]">
                {/* Aided Stream Collapsible */}
                <div className="border border-[#C5A059]/30 rounded-sm overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setMobileAidedOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-serif font-bold text-[#581A20] bg-emerald-50/50"
                  >
                    <span>Aided Stream (Shift I) &bull; 17 Depts</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        mobileAidedOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {mobileAidedOpen && (
                    <div className="p-2 max-h-56 overflow-y-auto scrollbar-thin space-y-1 bg-white">
                      {aidedList.map((dept) => (
                        <Link
                          key={dept.slug}
                          to={`/departments/${dept.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block px-2.5 py-1 text-xs text-gray-800 hover:text-white hover:bg-[#581A20] rounded font-medium"
                        >
                          {dept.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Self-Financed Stream Collapsible */}
                <div className="border border-[#C5A059]/30 rounded-sm overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setMobileSfsOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-serif font-bold text-[#0F2537] bg-purple-50/50"
                  >
                    <span>Self-Financed Stream (Shift II) &bull; 21 Depts</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        mobileSfsOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {mobileSfsOpen && (
                    <div className="p-2 max-h-56 overflow-y-auto scrollbar-thin space-y-1 bg-white">
                      {sfsList.map((dept) => (
                        <Link
                          key={dept.slug}
                          to={`/departments/${dept.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block px-2.5 py-1 text-xs text-gray-800 hover:text-white hover:bg-[#581A20] rounded font-medium"
                        >
                          {dept.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* All Departments Link */}
                <Link
                  to="/departments"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2 text-xs font-serif font-bold text-[#581A20] bg-[#581A20]/10 rounded border border-[#581A20]/30 hover:bg-[#581A20] hover:text-white transition-colors"
                >
                  Browse All 38 Department Bureaus &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
