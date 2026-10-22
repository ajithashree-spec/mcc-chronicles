import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import BreakingNewsBanner from '../common/BreakingNewsBanner';

/**
 * Standard Broadsheet Layout Shell for The MCC Chronicles.
 * Wraps pages in the grand masthead, category navigation, main container, and institutional footer.
 */
export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-gray-900 font-sans selection:bg-[#C5A059]/30 selection:text-[#581A20] w-full max-w-full">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
      <Footer />
      <BreakingNewsBanner />
    </div>
  );
}
