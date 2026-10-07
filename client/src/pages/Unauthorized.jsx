import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

export default function Unauthorized() {
  const { user, logout } = useAuth();

  return (
    <div className="py-16 text-center max-w-2xl mx-auto px-4 space-y-6 animate-in fade-in duration-300">
      <div className="w-16 h-16 rounded-full bg-red-100 border border-red-300 flex items-center justify-center mx-auto text-mcc-maroon shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-serif uppercase tracking-widest text-mcc-maroon font-bold">
          Security Protocol • Status 403
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-black text-gray-900 tracking-tight">
          Editorial Clearance Required
        </h1>
        <p className="text-sm font-serif text-gray-600 leading-relaxed max-w-lg mx-auto">
          You are authenticated as <strong>{user?.name || user?.email || 'MCC Scholar'}</strong> with role{' '}
          <span className="inline-block bg-mcc-maroon/10 text-mcc-maroon px-2 py-0.5 rounded text-xs uppercase font-bold tracking-wider">
            {user?.role || 'Guest'}
          </span>
          . This editorial partition requires elevated administrative credentials.
        </p>
      </div>

      <div className="pt-6 border-t border-mcc-maroon/20 flex flex-wrap items-center justify-center gap-4 text-xs font-serif uppercase tracking-wider font-semibold">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-mcc-maroon text-white rounded hover:bg-mcc-maroon-dark transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-mcc-gold" />
          <span>Return to Broadsheet Front Page</span>
        </Link>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-mcc-maroon/30 text-mcc-maroon rounded hover:bg-mcc-halfwhite transition-colors"
        >
          <LogOut className="w-4 h-4 text-mcc-gold" />
          <span>Switch Credentials / Sign Out</span>
        </button>
      </div>
    </div>
  );
}
