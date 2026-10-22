import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Award,
  Compass,
  TreePine,
  Feather,
  Clock,
  Building,
  Quote,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-14 animate-in fade-in duration-300">
      {/* 1. BREADCRUMB */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-serif text-gray-500 mb-6">
        <Link to="/" className="hover:text-mcc-maroon transition-colors">
          Home
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-mcc-maroon font-bold font-serif">Campus Heritage & About</span>
      </nav>

      {/* 2. GRAND MASTHEAD HEADER */}
      <header className="text-center mb-12 border-b-2 border-mcc-maroon pb-8">
        <span className="text-xs font-serif uppercase tracking-[0.25em] text-mcc-gold font-bold block mb-2">
          Historical Colophon & Journal of Record
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-black text-gray-950 uppercase tracking-tight">
          The MCC Chronicles
        </h1>
        <p className="text-base sm:text-lg font-serif italic text-gray-700 mt-3 max-w-2xl mx-auto leading-relaxed">
          &ldquo;Lighted to Lighten&rdquo; — The Official Broadsheet of Record of Madras Christian College, documenting collegiate life, scholarship, and lore since 1837.
        </p>

        <div className="mt-4 flex items-center justify-center gap-4 text-xs font-serif text-gray-500 uppercase tracking-wider">
          <span>Est. 1837</span>
          <span>•</span>
          <span>Tambaram, Chennai</span>
          <span>•</span>
          <span>Volume CLXXXIX</span>
        </div>
      </header>

      {/* AUTHENTIC MCC CAMPUS HERITAGE PANORAMA */}
      <div className="mb-12 overflow-hidden rounded-lg border-2 border-mcc-maroon shadow-md">
        <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full overflow-hidden bg-gray-900">
          <img
            src="/images/mcc-campus-hero.jpg"
            alt="Madras Christian College Iconic Main Quadrangle & Campus Grounds"
            className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700 hd-broadsheet-photo"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4 sm:p-6 text-white">
            <span className="text-[10px] sm:text-xs font-serif uppercase tracking-[0.2em] text-mcc-gold font-bold">
              Historic Tambaram Campus • Founded 1837
            </span>
            <p className="font-serif italic text-sm sm:text-base text-gray-200 mt-0.5">
              The iconic Main Quadrangle & lush campus grounds of Madras Christian College
            </p>
          </div>
        </div>
      </div>

      {/* 3. KEYSTONE EDITORIAL STATEMENT */}
      <div className="mb-12 p-6 sm:p-8 bg-mcc-paper border-l-4 border-mcc-maroon rounded-r-md shadow-xs">
        <Quote className="w-8 h-8 text-mcc-gold mb-2 opacity-80" />
        <blockquote className="font-serif text-lg sm:text-xl text-gray-900 leading-relaxed italic">
          &ldquo;A collegiate journal is neither an administrative bulletin nor a mere ledger of dates. It is the living memory of a sacred sanctuary where young scholars encounter timeless truth, test intellectual freedom, and write chapters that outlive their youth.&rdquo;
        </blockquote>
        <div className="mt-3 text-xs font-serif uppercase tracking-widest text-mcc-maroon font-bold">
          — Excerpt from the inaugural Tambaram Broadsheet Charter (1937)
        </div>
      </div>

      {/* 4. MULTI-COLUMN BROADSHEET HISTORY SECTIONS */}
      <div className="space-y-12">
        {/* SECTION 1: THE HERITAGE */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-4 border-t-2 border-mcc-navy pt-3">
            <span className="text-xs font-serif uppercase tracking-widest text-mcc-gold font-bold block mb-1">
              Part One
            </span>
            <h2 className="font-serif text-2xl font-bold text-mcc-navy">
              The Anderson & Miller Heritage
            </h2>
            <span className="text-xs text-gray-500 font-serif block mt-1">
              From George Town to the Scrub Jungle (1837–1937)
            </span>
          </div>

          <div className="md:col-span-8 space-y-4 text-sm sm:text-base font-serif text-gray-800 leading-relaxed">
            <p className="first-letter:text-5xl first-letter:font-serif first-letter:font-black first-letter:text-mcc-maroon first-letter:float-left first-letter:mr-3 first-letter:leading-none">
              Founded on April 3, 1837 by Rev. John Anderson in a modest rented house on Armenian Street, Madras Christian College emerged as an uncompromising bastion of liberal arts and scientific inquiry in colonial Southern India. Under the visionary helm of Dr. William Miller, the institution expanded into a premier collegiate university center that pioneered inter-religious dialogue and autonomous scholastic traditions.
            </p>
            <p>
              In 1937, under the leadership of Principal Alexander Wood, the college orchestrated its monumental migration from the congested harbor quarters of George Town to the idyllic, 365-acre expanse of scrub jungle in Tambaram. Here, flanked by ancient palmyra trees and migrating waterbirds, the collegiate community established the iconic Anderson Quadrangle, Miller Memorial Library, and the residential halls that anchor campus life to this day.
            </p>
          </div>
        </section>

        {/* SECTION 2: THE SCRUB JUNGLE SANCTUARY */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start border-t border-gray-200 pt-10">
          <div className="md:col-span-4 border-t-2 border-mcc-gold pt-3">
            <span className="text-xs font-serif uppercase tracking-widest text-mcc-maroon font-bold block mb-1">
              Part Two
            </span>
            <h2 className="font-serif text-2xl font-bold text-mcc-navy">
              The 365-Acre Living Sanctuary
            </h2>
            <span className="text-xs text-gray-500 font-serif block mt-1">
              Biodiversity, Guthridge Tower & Hall Fellowship
            </span>
          </div>

          <div className="md:col-span-8 space-y-4 text-sm sm:text-base font-serif text-gray-800 leading-relaxed">
            <p>
              Unlike conventional urban campuses, Madras Christian College functions within a protected tropical scrub ecosystem that harbors over 150 species of indigenous flora, resident deer herds, and migratory avian species. The architectural composition—designed by Henry Schaetti—harmoniously integrates red-brick colonial colonnades with indigenous vegetation.
            </p>
            <p>
              The legendary residential halls—Selaiyur, St. Thomas&rsquo;s, Bishop Heber, Martin, Margaret, and Barnes—form the bedrock of collegiate fraternity and debate. It is within these quadrangles that annual cultural anthems like DeepWoods and the fierce inter-hall forensic tournaments were forged.
            </p>
            {/* AUTHENTIC PHOTO DUO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
              <div className="rounded border border-mcc-maroon/20 overflow-hidden shadow-xs">
                <img
                  src="/images/mcc-scrub-jungle.jpg"
                  alt="Madras Christian College 365-Acre Scrub Jungle Tree Canopy"
                  className="w-full h-44 object-cover object-center hd-broadsheet-photo"
                />
                <div className="p-2.5 bg-mcc-paper border-t border-mcc-maroon/10 text-[11px] text-gray-700 italic font-serif">
                  The legendary scrub woodland tree canopy avenue in Tambaram
                </div>
              </div>
              <div className="rounded border border-mcc-maroon/20 overflow-hidden shadow-xs">
                <img
                  src="/images/mcc-academic-quad.jpg"
                  alt="Madras Christian College Historic Academic Block & Walkways"
                  className="w-full h-44 object-cover object-center hd-broadsheet-photo"
                />
                <div className="p-2.5 bg-mcc-paper border-t border-mcc-maroon/10 text-[11px] text-gray-700 italic font-serif">
                  Historic double-storey academic block & student pathways
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: EDITORIAL MISSION & THE NEWSROOM */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start border-t border-gray-200 pt-10">
          <div className="md:col-span-4 border-t-2 border-mcc-maroon pt-3">
            <span className="text-xs font-serif uppercase tracking-widest text-mcc-gold font-bold block mb-1">
              Part Three
            </span>
            <h2 className="font-serif text-2xl font-bold text-mcc-navy">
              The Chronicles Newsroom
            </h2>
            <span className="text-xs text-gray-500 font-serif block mt-1">
              Student Independence & Journalistic Stewardship
            </span>
          </div>

          <div className="md:col-span-8 space-y-4 text-sm sm:text-base font-serif text-gray-800 leading-relaxed">
            <p>
              <em>The MCC Chronicles</em> operates as an independent, student-directed broadsheet journal supported by faculty advisors from the Departments of English, History, and Journalism. Our mission is three-fold:
            </p>
            <ul className="space-y-2 list-disc list-inside text-sm">
              <li>
                <strong>To chronicle collegiate events with accuracy</strong>, ensuring that academic achievements, sports victories, and cultural milestones are faithfully preserved.
              </li>
              <li>
                <strong>To foster fearless intellectual exchange</strong> through student investigative reports, faculty dispatches, and open reader correspondence.
              </li>
              <li>
                <strong>To maintain an archival repository</strong> connecting generations of MCC alumni around the globe with the enduring pulse of Tambaram.
              </li>
            </ul>
          </div>
        </section>
      </div>

      {/* 5. CALL TO ACTION BAR */}
      <div className="mt-14 p-8 bg-white border border-mcc-maroon/20 rounded-md shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="font-serif text-xl font-bold text-gray-900">
            Contribute to The MCC Chronicles
          </h3>
          <p className="text-xs sm:text-sm font-serif text-gray-600">
            Are you an MCCian, faculty member, or researcher with a dispatch or historical scoop?
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-mcc-maroon hover:bg-mcc-maroon-dark text-white rounded text-xs font-serif font-bold uppercase tracking-wider transition-colors shadow-xs"
          >
            <span>Submit a Dispatch</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/ethics"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-mcc-paper text-gray-700 border border-gray-300 rounded text-xs font-serif font-bold uppercase tracking-wider transition-colors"
          >
            <span>Editorial Charter</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
