import React from 'react';
import { Newspaper } from 'lucide-react';

export default function BroadsheetSpinner({ message = 'Composing Broadsheet Edition...' }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 font-serif animate-in fade-in duration-300">
      <div className="relative mb-4">
        {/* Outer Spinning Ring */}
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-mcc-maroon/30 animate-spin" />
        {/* Inner Spinning Ring */}
        <div className="w-12 h-12 rounded-full border-2 border-t-mcc-gold border-r-transparent border-b-mcc-maroon border-l-transparent animate-spin absolute inset-2" />
        {/* Center Broadsheet Emblem */}
        <div className="w-8 h-8 rounded-full bg-mcc-maroon text-white flex items-center justify-center absolute inset-4 shadow-xs">
          <Newspaper className="w-4 h-4 text-mcc-gold animate-pulse" />
        </div>
      </div>

      <span className="text-xs font-sans font-bold uppercase tracking-widest text-mcc-gold">
        The MCC Chronicles
      </span>
      <h3 className="text-lg font-bold text-gray-900 mt-1">
        {message}
      </h3>
      <p className="text-xs text-gray-500 italic mt-0.5">
        Retrieving archival records from the Tambaram press...
      </p>
    </div>
  );
}
