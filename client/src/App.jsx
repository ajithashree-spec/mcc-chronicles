import React from 'react';
import { Newspaper, Bell } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-mcc-oxblood text-white border-b-4 border-mcc-brass">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/assets/mcc-crest.png" alt="MCC Crest" className="h-12 w-auto object-contain" />
            <div>
              <h1 className="text-2xl font-serif font-bold tracking-tight">MCC Chronicles</h1>
              <p className="text-xs text-mcc-champagne tracking-widest uppercase">Madras Christian College Digital Gazette</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="flex items-center gap-1 bg-mcc-heritage px-3 py-1 rounded-full text-xs text-white">
              <Bell className="w-3.5 h-3.5 text-mcc-brass" /> Live Gazette
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-lg border border-mcc-border p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Newspaper className="w-8 h-8 text-mcc-heritage" />
            <h2 className="text-3xl font-serif font-bold text-mcc-oxblood">Welcome to MCC Chronicles</h2>
          </div>
          <p className="text-mcc-midnight text-base leading-relaxed">
            The official digital journalism and real-time dispatches portal for Madras Christian College.
          </p>
        </div>
      </main>

      <footer className="bg-mcc-shadow text-white py-6 border-t border-mcc-oxblood">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-stone-400">
          © {new Date().getFullYear()} Madras Christian College (Autonomous), Tambaram, Chennai. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
