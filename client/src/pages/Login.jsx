import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  User,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Shield,
  KeyRound,
  FileText,
  Settings,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';

export default function Login({ portal: explicitPortal }) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const changedParam = searchParams.get('changed');
  const userParam = searchParams.get('user');

  const [username, setUsername] = useState(userParam || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(
    changedParam
      ? 'Password changed successfully! Please log in using your newly configured password.'
      : ''
  );

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Determine active portal mode
  const activePortal =
    explicitPortal ||
    (location.pathname.startsWith('/superadmin')
      ? 'superadmin'
      : location.pathname.startsWith('/admin')
      ? 'admin'
      : null);

  const isSuper = activePortal === 'superadmin';
  const isAdmin = activePortal === 'admin';

  const defaultRedirect = isSuper ? '/superadmin' : '/admin';
  const from = location.state?.from?.pathname || defaultRedirect;

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated()) {
      const userStr = localStorage.getItem('mcc_user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      let target = from;
      if (from === '/dashboard' || from === '/login' || from === '/' || from === '/admin/login' || from === '/superadmin/login') {
        target = (currentUser?.role === 'superadmin' || currentUser?.role === 'super_admin') ? '/superadmin' : '/admin';
      }
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please provide both administrative identifier and security password.');
      return;
    }

    try {
      setSubmitting(true);
      const portalParam = activePortal || 'superadmin';
      const loggedUser = await login(username, password, portalParam);

      let targetPath = from;
      if (from === '/dashboard' || from === '/login' || from === '/' || from === '/admin/login' || from === '/superadmin/login') {
        if (activePortal === 'admin') {
          targetPath = '/admin';
        } else if (activePortal === 'superadmin') {
          targetPath = '/superadmin';
        } else {
          targetPath = (loggedUser?.role === 'superadmin' || loggedUser?.role === 'super_admin') ? '/superadmin' : '/admin';
        }
      }
      navigate(targetPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-mcc-paper flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-mcc-gold/30 selection:text-mcc-maroon">
      {/* Return to Front Page Link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mb-4 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-serif uppercase tracking-wider text-gray-600 hover:text-mcc-maroon transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-mcc-gold" />
          <span>Return to Broadsheet</span>
        </Link>

        {/* Portal Switcher */}
        {isSuper && (
          <Link
            to="/admin/login"
            className="text-[11px] font-serif text-mcc-maroon hover:underline flex items-center gap-1"
          >
            <span>Switch to /admin</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        )}
        {isAdmin && (
          <Link
            to="/superadmin/login"
            className="text-[11px] font-serif text-mcc-maroon hover:underline flex items-center gap-1"
          >
            <span>Switch to /superadmin</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Masthead Header */}
        <div className="text-center">
          <img
            src="/assets/mcc-crest.png"
            alt="Madras Christian College Crest"
            className="h-20 w-auto mx-auto object-contain drop-shadow"
          />
          <h1 className="mt-4 text-2xl sm:text-3xl font-serif font-black text-mcc-maroon uppercase tracking-tight">
            {isSuper
              ? 'Institutional Governance'
              : isAdmin
              ? 'Unified Editorial Desk'
              : 'The MCC Chronicles'}
          </h1>
          <p className="mt-1 text-xs font-serif uppercase tracking-[0.2em] text-mcc-navy font-semibold">
            {isSuper
              ? 'Super Admin Master Access • /superadmin'
              : isAdmin
              ? 'Editorial Dispatch Desk • /admin'
              : 'Collegiate Newsroom Authentication'}
          </p>
        </div>

        {/* Dual Portal Selector Tabs (if on generic /login) */}
        {!activePortal && (
          <div className="mt-6 grid grid-cols-2 gap-2 p-1 bg-gray-200/70 rounded-md">
            <Link
              to="/admin/login"
              className="py-2 text-center text-xs font-serif font-bold uppercase rounded bg-white text-mcc-maroon shadow-xs flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-mcc-gold" />
              <span>Editorial (/admin)</span>
            </Link>
            <Link
              to="/superadmin/login"
              className="py-2 text-center text-xs font-serif font-bold uppercase rounded text-gray-700 hover:bg-white/60 transition-colors flex items-center justify-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-mcc-navy" />
              <span>Governance (/superadmin)</span>
            </Link>
          </div>
        )}

        {/* Card Form */}
        <div className="mt-6 bg-white py-8 px-6 sm:px-10 shadow-lg rounded-lg border-t-4 border-mcc-maroon border-x border-b border-gray-200">
          {notice && !error && (
            <div className="mb-6 p-4 rounded bg-emerald-50 border border-emerald-300 flex items-start gap-3 text-emerald-900 text-xs animate-in fade-in duration-200">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Credentials Updated</p>
                <p className="mt-0.5">{notice}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Denied</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-700 mb-1"
              >
                {isSuper
                  ? 'Super Admin Username / ID'
                  : isAdmin
                  ? 'Editorial Desk Username'
                  : 'Username or Institutional Email'}
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mcc-maroon focus:border-transparent font-sans"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-700"
                >
                  Password
                </label>
              </div>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mcc-maroon focus:border-transparent font-sans"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded shadow-sm text-xs font-serif uppercase tracking-widest font-bold text-white bg-mcc-maroon hover:bg-mcc-maroon-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mcc-maroon disabled:opacity-50 transition-colors cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-mcc-gold" />
                    <span>Verifying Session...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 text-mcc-gold" />
                    <span>
                      {isSuper
                        ? 'Sign In to Super Admin Governance'
                        : isAdmin
                        ? 'Sign In to Editorial Desk'
                        : 'Sign In to Portal'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Institutional Credentials Notice */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start gap-2 text-[11px] text-gray-500">
              <Shield className="w-4 h-4 text-mcc-gold shrink-0 mt-0.5" />
              <p>
                {isSuper
                  ? 'Access restricted to Master System Administrators of Madras Christian College.'
                  : isAdmin
                  ? 'Authorized for accredited Editorial Board Members, Department Editors, and Reporters.'
                  : 'Authorized for accredited Staff, Editorial Board Members, and System Administrators.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer colophon */}
        <p className="mt-8 text-center text-[11px] text-gray-500 font-serif">
          The MCC Chronicles • Est. 1837 • Madras Christian College, Tambaram
        </p>
      </div>
    </div>
  );
}
