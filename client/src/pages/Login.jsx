import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Shield,
  KeyRound,
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated()) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide both institutional email and security credential.');
      return;
    }

    try {
      setSubmitting(true);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-mcc-paper flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-mcc-gold/30 selection:text-mcc-maroon">
      {/* Return to Front Page Link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-serif uppercase tracking-wider text-gray-600 hover:text-mcc-maroon transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-mcc-gold" />
          <span>Return to Broadsheet Front Page</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="text-center">
          <img
            src="/assets/mcc-crest.png"
            alt="Madras Christian College Crest"
            className="h-20 w-auto mx-auto object-contain drop-shadow"
          />
          <h1 className="mt-4 text-3xl font-serif font-black text-mcc-maroon uppercase tracking-tight">
            The MCC Chronicles
          </h1>
          <p className="mt-1 text-xs font-serif uppercase tracking-[0.2em] text-mcc-navy font-semibold">
            Editorial Desk & Staff Authentication
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-6 sm:px-10 shadow-lg rounded-lg border-t-4 border-mcc-maroon border-x border-b border-gray-200">
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
                htmlFor="email"
                className="block text-xs font-serif uppercase tracking-wider font-bold text-gray-700 mb-1"
              >
                Institutional Email Address
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="editor@mcc.edu.in"
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
                  Password Key
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
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mcc-maroon focus:border-transparent font-sans"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded shadow-sm text-xs font-serif uppercase tracking-widest font-bold text-white bg-mcc-maroon hover:bg-mcc-maroon-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mcc-maroon disabled:opacity-50 transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-mcc-gold" />
                    <span>Verifying Session...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 text-mcc-gold" />
                    <span>Sign In to Editorial Portal</span>
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
                Authorized for accredited Faculty, Editorial Board Members, Reporters, and System Administrators of Madras Christian College (Autonomous).
              </p>
            </div>
          </div>
        </div>

        {/* Footer colophon */}
        <p className="mt-8 text-center text-[11px] text-gray-500 font-serif">
          The MCC Chronicles • Est. 1837 • Tambaram, Chennai
        </p>
      </div>
    </div>
  );
}
