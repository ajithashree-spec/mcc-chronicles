import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Award,
  ShieldCheck,
  ExternalLink,
  Phone,
  Mail,
  Compass,
  Layers,
} from 'lucide-react';
import { usePageSettings } from '../../context/PageSettingsContext';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { settings } = usePageSettings();

  return (
    <footer className="bg-[#581A20] text-[#FAF8F5] border-t-4 border-[#C5A059] font-sans mt-auto shadow-inner">
      {/* 1. MAIN 3-COLUMN INSTITUTIONAL FOOTER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 items-start">
          {/* COLUMN 1: INSTITUTIONAL IDENTITY */}
          <div className="space-y-4">
            <div className="flex items-center gap-3.5">
              <img
                src="/assets/mcc-crest.png"
                alt="Madras Christian College Crest"
                className="h-14 sm:h-16 w-auto object-contain filter drop-shadow-md brightness-105"
              />
              <div>
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#FAF8F5] tracking-tight leading-tight">
                  {settings.header_brand_title || 'Madras Christian College'}
                </h3>
                <span className="text-[10px] sm:text-[11px] font-sans font-bold tracking-[0.25em] text-[#C5A059] uppercase block mt-0.5">
                  {settings.header_brand_subtitle || 'CAMPUS NEWS PORTAL'}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#FAF8F5]/90 leading-relaxed font-serif">
              {settings.footer_description ||
                'An autonomous liberal arts and sciences institution affiliated with the University of Madras. Dedicated to academic excellence, investigative student journalism, and scientific inquiry in the 365-acre scrub jungle sanctuary.'}
            </p>

            <div className="space-y-1.5 text-xs text-[#FAF8F5]/90 pt-1">
              <div className="flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                <span className="font-medium">
                  {settings.footer_accreditation || 'Autonomous Institution • NAAC A++ Grade'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                <span className="font-serif italic text-[#C5A059]">
                  {settings.footer_motto || 'Motto: "Lighted to Lighten" • Est. 1837'}
                </span>
              </div>
            </div>
          </div>

          {/* COLUMN 2: QUICK LINKS (Strictly Read-Only, No Login/Submit CTA) */}
          <div className="space-y-3">
            <h4 className="text-[#C5A059] font-serif font-bold text-sm tracking-widest uppercase mb-3 pb-2 border-b border-[#C5A059]/30">
              Navigation Desks
            </h4>
            <ul className="space-y-2.5 text-xs font-serif">
              <li>
                <Link
                  to="/"
                  className="text-[#FAF8F5]/80 hover:text-[#C5A059] text-xs transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] group-hover:scale-125 transition-transform" />
                  <span className="font-medium">Home</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/news"
                  className="text-[#FAF8F5]/80 hover:text-[#C5A059] text-xs transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] group-hover:scale-125 transition-transform" />
                  <span className="font-medium">Campus News & Dispatches</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/circulars"
                  className="text-[#FAF8F5]/80 hover:text-[#C5A059] text-xs transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] group-hover:scale-125 transition-transform" />
                  <span className="font-medium">Official Circulars & Gazette</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/departments"
                  className="text-[#FAF8F5]/80 hover:text-[#C5A059] text-xs transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] group-hover:scale-125 transition-transform" />
                  <span className="font-medium">Academic Departments (38 Bureaus)</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/gallery"
                  className="text-[#FAF8F5]/80 hover:text-[#C5A059] text-xs transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] group-hover:scale-125 transition-transform" />
                  <span className="font-medium">Collegiate Media Gallery</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/map"
                  className="text-[#FAF8F5]/80 hover:text-[#C5A059] text-xs transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] group-hover:scale-125 transition-transform" />
                  <span className="font-medium">Interactive Campus Map & Landmarks</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: INSTITUTIONAL ADDRESS & CAMPUS CONTACT */}
          <div className="space-y-3">
            <h4 className="text-[#C5A059] font-serif font-bold text-sm tracking-widest uppercase mb-3 pb-2 border-b border-[#C5A059]/30">
              Tambaram Campus
            </h4>
            <div className="space-y-2.5 text-xs text-[#FAF8F5]/90 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                <span className="whitespace-pre-line">
                  {settings.footer_address ||
                    'Madras Christian College,\nTambaram East, Chennai - 600059,\nTamil Nadu, India'}
                </span>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <Phone className="w-4 h-4 text-[#C5A059] shrink-0" />
                <a
                  href={`tel:${settings.footer_phone || '+914422390675'}`}
                  className="font-mono text-[#FAF8F5]/85 hover:text-[#C5A059] transition-colors"
                >
                  {settings.footer_phone || '+91 44 2239 0675'}
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#C5A059] shrink-0" />
                <a
                  href={`mailto:${settings.footer_email || 'principal@mcc.edu.in'}`}
                  className="font-mono text-[#FAF8F5]/85 hover:text-[#C5A059] transition-colors"
                >
                  {settings.footer_email || 'principal@mcc.edu.in'}
                </a>
              </div>

              <div className="pt-2">
                <a
                  href={settings.footer_college_url || 'https://mcc.edu.in'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C5A059] hover:text-white transition-colors"
                >
                  <span>{settings.footer_college_label || 'College Official Portal (mcc.edu.in)'}</span>
                  <ExternalLink className="w-3 h-3 text-[#C5A059]" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUB-FOOTER BAR (Dark Midnight Navy #0A1926 + Hairline Gold Rule) */}
      <div className="border-t border-[#C5A059]/30 bg-[#0A1926] text-[11px] text-[#FAF8F5]/70 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            &copy; {currentYear}{' '}
            <strong className="text-[#FAF8F5]">
              {settings.footer_copyright || 'Madras Christian College. All rights reserved. Official Campus News Portal.'}
            </strong>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[#FAF8F5]/75">
            <Link to="/about" className="hover:text-[#C5A059] transition-colors">
              About
            </Link>
            <span className="text-[#C5A059]/60">&bull;</span>
            <Link to="/ethics" className="hover:text-[#C5A059] transition-colors">
              Editorial Ethics
            </Link>
            <span className="text-[#C5A059]/60">&bull;</span>
            <Link to="/contact" className="hover:text-[#C5A059] transition-colors">
              Contact Desk
            </Link>
            <span className="text-[#C5A059]/60">&bull;</span>
            <Link to="/login" className="hover:text-[#C5A059] transition-colors">
              Staff Portal
            </Link>
            <span className="text-[#C5A059]/60">&bull;</span>
            <a href="/api/feed/rss" target="_blank" rel="noopener noreferrer" className="hover:text-[#C5A059] transition-colors">
              RSS Feed
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
