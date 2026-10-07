import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Menu,
  X,
  LogIn,
  LayoutDashboard,
  Sun,
  BookOpen,
  Newspaper,
  Calendar,
  ExternalLink,
  ChevronRight,
  Bookmark,
} from 'lucide-react';
import SearchModal from '../search/SearchModal';
import ReadingListDrawer from '../common/ReadingListDrawer';
import { useReadingList } from '../../hooks/useReadingList';

const NAV_ITEMS = [
  { name: 'Home', path: '/' },
  { name: 'Campus News', path: '/category/campus-news' },
  { name: 'Academics', path: '/category/academics' },
  { name: 'DeepWoods & Cultural', path: '/category/deepwoods-cultural' },
  { name: 'Sports', path: '/category/sports' },
  { name: 'Research', path: '/category/research' },
  { name: 'Departments', path: '/departments' },
  { name: 'Galleries', path: '/gallery' },
  { name: 'Circulars', path: '/circulars' },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [readingListOpen, setReadingListOpen] = useState(false);
  const { count: readingListCount } = useReadingList();
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Dynamic formatted date
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [largeText, setLargeText] = useState(false);

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

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 120);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="w-full bg-mcc-paper border-b border-mcc-maroon/20 text-gray-900">
      {/* 1. TOP THIN TICKER / INSTITUTIONAL DATE BAR */}
      <div className="border-b border-mcc-maroon/15 bg-mcc-halfwhite/60 text-xs py-1.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Left: Live Edition & Heritage Badge */}
          <div className="flex items-center gap-3 font-medium text-gray-600">
            <span className="flex items-center gap-1.5 text-mcc-maroon font-semibold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-mcc-gold" />
              {currentDateStr || 'Monday, October 5, 2026'}
            </span>
            <span className="hidden md:inline-block text-gray-300">•</span>
            <span className="hidden md:inline text-gray-600 tracking-wide">
              The Official Campus Journal of Madras Christian College (Autonomous) • Est. 1837
            </span>
          </div>

          {/* Right: Quick Links & Weather */}
          <div className="flex items-center gap-4 text-gray-600">
            <div className="hidden sm:flex items-center gap-1.5 text-gray-600">
              <Sun className="w-3.5 h-3.5 text-mcc-gold" />
              <span>Tambaram 31°C • Fair</span>
            </div>
            <span className="hidden sm:inline-block text-gray-300">•</span>

            {/* Accessibility Font Size Toggle */}
            <div
              className="flex items-center gap-0.5 border border-gray-300 rounded px-1 py-0.5 text-[11px] font-serif bg-white shadow-2xs"
              title="Adjust Reader Text Size"
            >
              <button
                type="button"
                onClick={() => setLargeText(false)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  !largeText
                    ? 'bg-mcc-maroon text-white font-bold'
                    : 'text-gray-600 hover:text-mcc-maroon'
                }`}
                title="Standard Text Size"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setLargeText(true)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  largeText
                    ? 'bg-mcc-maroon text-white font-bold'
                    : 'text-gray-600 hover:text-mcc-maroon'
                }`}
                title="Large Text Size"
              >
                A+
              </button>
            </div>
            <span className="text-gray-300">•</span>

            <Link
              to="/circulars"
              className="hover:text-mcc-maroon transition-colors font-medium"
            >
              Circulars
            </Link>
            <span className="text-gray-300">•</span>
            {isAuthenticated() ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 text-mcc-maroon font-semibold hover:text-mcc-maroon-dark transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-mcc-gold" />
                <span>Dashboard ({user?.name ? user.name.split(' ')[0] : 'Desk'})</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1 text-mcc-maroon font-semibold hover:text-mcc-maroon-dark transition-colors"
              >
                <LogIn className="w-3 h-3 text-mcc-gold" />
                <span>Staff Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 2. GRAND BROADSHEET MASTHEAD */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-center relative">
        <div className="flex flex-col items-center justify-center">
          {/* Top Heritage Crest & Vol/Issue Subhead */}
          <div className="w-full flex items-center justify-between text-[11px] font-serif uppercase tracking-widest text-gray-500 border-b border-mcc-maroon/20 pb-2 mb-4">
            <span className="hidden sm:inline">Vol. CLXXXVII • No. 42</span>
            <span className="mx-auto sm:mx-0 font-medium tracking-[0.2em] text-mcc-maroon">
              Lighted to Lighten • Founded in 1837
            </span>
            <span className="hidden sm:inline">Chennai Gazette Edition</span>
          </div>

          {/* Main Ornate Masthead Brand */}
          <Link
            to="/"
            className="group flex flex-col sm:flex-row items-center justify-center gap-4 my-2 text-center"
          >
            <img
              src="/assets/mcc-crest.png"
              alt="Madras Christian College Crest"
              className="h-16 sm:h-20 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <div className="text-center sm:text-left">
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-black tracking-tight text-mcc-maroon drop-shadow-sm uppercase">
                The MCC Chronicles
              </h1>
              <p className="text-xs sm:text-sm font-serif tracking-[0.25em] text-mcc-navy uppercase font-semibold mt-1">
                Truth • Freedom • Excellence | Tambaram, Chennai
              </p>
            </div>
          </Link>

          {/* Double Hairline Broadsheet Rule */}
          <div className="w-full mt-4 border-t border-b-2 border-mcc-maroon/25 py-0.5">
            <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.2em] text-gray-600 px-2 py-0.5">
              <span>Autonomous Institution Affiliated to the University of Madras</span>
              <span className="hidden md:inline">NAAC A++ Grade Re-Accredited</span>
              <span>Tambaram East, Chennai - 600059</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. STICKY CATEGORY NAVIGATION BAR */}
      <nav
        className={`sticky top-0 z-40 w-full transition-all duration-200 border-t border-b border-mcc-maroon/20 ${
          isScrolled
            ? 'bg-mcc-paper/95 backdrop-blur-md shadow-md py-2'
            : 'bg-mcc-paper py-2.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-mcc-maroon hover:bg-mcc-halfwhite focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <span className="ml-2 font-serif font-bold text-mcc-maroon lg:hidden text-lg">
              Sections
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center justify-center flex-1 space-x-1 xl:space-x-2">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-xs xl:text-sm font-serif uppercase tracking-wider font-semibold transition-all relative ${
                    isActive
                      ? 'text-mcc-maroon font-bold'
                      : 'text-gray-700 hover:text-mcc-maroon hover:bg-mcc-maroon/5 rounded'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{item.name}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-mcc-gold rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Action Buttons: Reading List & Search */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setReadingListOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase font-semibold text-gray-700 hover:text-mcc-maroon hover:bg-mcc-halfwhite border border-mcc-maroon/20 rounded transition-colors relative"
              aria-label="View Reading List"
              title="My Broadsheet Reading List"
            >
              <Bookmark className={`w-3.5 h-3.5 ${readingListCount > 0 ? 'text-mcc-maroon fill-mcc-gold' : 'text-mcc-gold'}`} />
              <span className="hidden sm:inline">Reading List</span>
              {readingListCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-sans font-bold leading-none text-white bg-mcc-maroon rounded-full">
                  {readingListCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase font-semibold text-gray-700 hover:text-mcc-maroon hover:bg-mcc-halfwhite border border-mcc-maroon/20 rounded transition-colors"
              aria-label="Search The MCC Chronicles"
            >
              <Search className="w-3.5 h-3.5 text-mcc-gold" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>
        </div>

        {/* GLOBAL SEARCH MODAL */}
        <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

        {/* READING LIST SLIDE-OVER DRAWER */}
        <ReadingListDrawer isOpen={readingListOpen} onClose={() => setReadingListOpen(false)} />

        {/* MOBILE NAVIGATION DRAWER */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-mcc-maroon/20 bg-mcc-paper px-4 pt-3 pb-6 space-y-1 shadow-lg animate-in slide-in-from-top-1">
            <div className="pb-2 border-b border-mcc-maroon/10 mb-2">
              <p className="text-xs font-serif font-bold text-mcc-maroon uppercase tracking-widest px-2">
                All Departments & Desks
              </p>
            </div>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 text-sm font-serif font-semibold rounded-md transition-colors ${
                    isActive
                      ? 'bg-mcc-maroon text-white'
                      : 'text-gray-800 hover:bg-mcc-halfwhite hover:text-mcc-maroon'
                  }`
                }
              >
                <span>{item.name}</span>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </NavLink>
            ))}
            <div className="pt-4 border-t border-mcc-maroon/15 mt-3 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setReadingListOpen(true);
                }}
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-serif font-semibold text-gray-800 hover:bg-mcc-halfwhite hover:text-mcc-maroon rounded-md border border-mcc-maroon/20"
              >
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-mcc-gold" />
                  <span>My Reading List</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-mcc-maroon text-white text-xs font-sans">
                  {readingListCount}
                </span>
              </button>

              {isAuthenticated() ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-mcc-maroon text-white font-medium text-xs uppercase tracking-wider rounded"
                >
                  <LayoutDashboard className="w-4 h-4 text-mcc-gold" />
                  <span>Editorial Dashboard ({user?.name || user?.role})</span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-mcc-maroon text-white font-medium text-xs uppercase tracking-wider rounded"
                >
                  <LogIn className="w-4 h-4 text-mcc-gold" />
                  <span>Editorial & Staff Portal</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
