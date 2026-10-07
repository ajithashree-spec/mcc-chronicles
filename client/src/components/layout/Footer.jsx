import React from 'react';
import { Link } from 'react-router-dom';
import {
  Rss,
  Mail,
  Send,
  ExternalLink,
  MapPin,
  Phone,
  ShieldCheck,
  Award,
} from 'lucide-react';
import NewsletterBox from '../common/NewsletterBox';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-mcc-navy text-gray-200 border-t-4 border-mcc-maroon font-sans">
      {/* 1. TOP EDITORIAL BANNER */}
      <div className="border-b border-white/10 bg-mcc-navy-dark py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left">
            <img
              src="/assets/mcc-crest.png"
              alt="MCC Crest"
              className="h-16 w-auto object-contain filter drop-shadow brightness-110"
            />
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide uppercase">
                The MCC Chronicles
              </h2>
              <p className="text-xs font-serif text-mcc-gold uppercase tracking-[0.2em] mt-0.5">
                The Autonomous Journal of Record • Founded 1837 • Tambaram, Chennai
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <Link
              to="/contact"
              className="px-4 py-2 bg-mcc-maroon text-white font-semibold rounded hover:bg-mcc-maroon-light transition-colors uppercase tracking-wider flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5 text-mcc-gold" />
              <span>Send Editorial Tip</span>
            </Link>
            <a
              href="/api/feed/rss"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-gray-200 font-medium rounded transition-colors flex items-center gap-1.5"
            >
              <Rss className="w-3.5 h-3.5 text-mcc-gold" />
              <span>RSS</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. MAIN 4-COLUMN BROADSHEET EDITORIAL GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Newsletter Subscription Box */}
        <NewsletterBox variant="footer" className="mb-12" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: Institutional Heritage */}
          <div>
            <h3 className="text-sm font-serif font-bold text-mcc-gold uppercase tracking-widest pb-2 border-b border-white/15 mb-4">
              Institutional Heritage
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed font-serif mb-4">
              Madras Christian College, established in 1837, is an autonomous liberal arts and sciences institution affiliated with the University of Madras.
            </p>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-mcc-gold shrink-0 mt-0.5" />
                <span>Tambaram East, Chennai - 600059, Tamil Nadu, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-mcc-gold shrink-0" />
                <span>NAAC A++ Grade • UGC Autonomous</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-mcc-gold shrink-0" />
                <span>Motto: &quot;That they may have life, and have it abundantly&quot;</span>
              </div>
            </div>
          </div>

          {/* Column 2: Journal Sections */}
          <div>
            <h3 className="text-sm font-serif font-bold text-mcc-gold uppercase tracking-widest pb-2 border-b border-white/15 mb-4">
              News Desks & Sections
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/category/campus-news" className="text-gray-300 hover:text-white transition-colors">
                  Campus News & Administration
                </Link>
              </li>
              <li>
                <Link to="/category/academics" className="text-gray-300 hover:text-white transition-colors">
                  Academics & Faculty Research
                </Link>
              </li>
              <li>
                <Link to="/category/deepwoods-cultural" className="text-gray-300 hover:text-white transition-colors">
                  DeepWoods Cultural Fest
                </Link>
              </li>
              <li>
                <Link to="/category/sports" className="text-gray-300 hover:text-white transition-colors">
                  Inter-Collegiate Sports & Athletics
                </Link>
              </li>
              <li>
                <Link to="/category/research" className="text-gray-300 hover:text-white transition-colors">
                  Scholarly Insights & Archives
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="text-gray-300 hover:text-white transition-colors">
                  Pictorial Gazette & Campus Galleries
                </Link>
              </li>
              <li>
                <Link to="/departments" className="text-gray-300 hover:text-white transition-colors">
                  Department Bureaus & Academic Directory
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Institutional Governance */}
          <div>
            <h3 className="text-sm font-serif font-bold text-mcc-gold uppercase tracking-widest pb-2 border-b border-white/15 mb-4">
              Governance & Gazette
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/circulars" className="text-gray-300 hover:text-white transition-colors">
                  Official Academic Circulars
                </Link>
              </li>
              <li>
                <a
                  href="https://mcc.edu.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>College Main Portal (mcc.edu.in)</span>
                  <ExternalLink className="w-3 h-3 text-gray-500" />
                </a>
              </li>
              <li>
                <span className="text-gray-400">Office of the Controller of Examinations</span>
              </li>
              <li>
                <span className="text-gray-400">Internal Quality Assurance Cell (IQAC)</span>
              </li>
              <li>
                <span className="text-gray-400">Miller Memorial Library & Archives</span>
              </li>
              <li>
                <Link to="/login" className="text-mcc-gold hover:underline">
                  Staff & Editorial Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Connect & Syndication */}
          <div>
            <h3 className="text-sm font-serif font-bold text-mcc-gold uppercase tracking-widest pb-2 border-b border-white/15 mb-4">
              Editorial Board & Feeds
            </h3>
            <p className="text-xs text-gray-300 mb-3 leading-relaxed">
              Have a campus scoop, student achievement, or historical photograph?
            </p>
            <div className="space-y-2 text-xs mb-4">
              <Link
                to="/about"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                About The MCC Chronicles
              </Link>
              <Link
                to="/ethics"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Editorial Charter & Ethics
              </Link>
              <Link
                to="/contact"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Submit Correction or Feedback
              </Link>
              <a
                href="/api/feed/rss"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                RSS 2.0 Syndication Feed
              </a>
              <a
                href="/api/feed/atom"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Atom 1.0 Syndication Feed
              </a>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                XML Sitemap Index
              </a>
            </div>
            <div className="text-[11px] text-gray-400 border-t border-white/10 pt-3">
              Editorial Desk: <span className="text-gray-200">editorial@mcc.edu.in</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM COLOPHON & COPYRIGHT */}
      <div className="border-t border-white/10 bg-mcc-navy-dark text-[11px] text-gray-400 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            © {currentYear} <strong>The MCC Chronicles</strong>. Published by the Editorial Board of Madras Christian College (Autonomous). All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <Link to="/about" className="hover:text-white transition-colors">
              About
            </Link>
            <span>•</span>
            <Link to="/ethics" className="hover:text-white transition-colors">
              Ethics
            </Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-white transition-colors">
              Contact Board
            </Link>
            <span>•</span>
            <a href="/sitemap.xml" className="hover:text-white transition-colors">
              Sitemap
            </a>
            <span>•</span>
            <a href="/api/feed/rss" className="hover:text-white transition-colors">
              RSS
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
