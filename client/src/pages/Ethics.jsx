import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  AlertCircle,
  FileText,
  Lock,
  Cpu,
  Mail,
  ArrowRight,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

export default function Ethics() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-14 animate-in fade-in duration-300">
      {/* 1. BREADCRUMB */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-serif text-gray-500 mb-6">
        <Link to="/" className="hover:text-mcc-maroon transition-colors">
          Home
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-mcc-maroon font-bold font-serif">Editorial Charter & Ethics</span>
      </nav>

      {/* 2. HEADER */}
      <header className="text-center mb-12 border-b-2 border-mcc-maroon pb-8">
        <span className="text-xs font-serif uppercase tracking-[0.25em] text-mcc-gold font-bold block mb-2">
          Collegiate Journalistic Standards
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-gray-950 uppercase tracking-tight">
          Editorial Charter & Standards
        </h1>
        <p className="text-sm sm:text-base font-serif italic text-gray-700 mt-2 max-w-2xl mx-auto leading-relaxed">
          The code of journalistic integrity, correction protocols, whistleblower protections, and archival typography guiding The MCC Chronicles.
        </p>
      </header>

      {/* 3. FOUR STRUCTURED POLICY SECTIONS */}
      <div className="space-y-10">
        {/* SECTION 1: JOURNALISTIC INTEGRITY & INDEPENDENCE */}
        <section className="bg-white p-6 sm:p-8 rounded-md border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <div className="p-2.5 rounded-full bg-mcc-maroon/10 text-mcc-maroon">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-serif uppercase tracking-widest text-mcc-gold font-bold block">
                Standard 01
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900">
                Journalistic Integrity & Editorial Independence
              </h2>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm font-serif text-gray-800 leading-relaxed">
            <p>
              <em>The MCC Chronicles</em> operates under the principle that campus journalism must be both truthful and fearlessly independent. While published with the patronage of Madras Christian College, our reporters and student editors adhere to established collegiate press freedoms.
            </p>
            <ul className="space-y-2 list-disc list-inside text-gray-700 pl-2">
              <li>
                <strong>Rigorous Fact-Checking:</strong> Every claim, quotation, and attribution must be cross-verified with at least two documented sources or institutional records prior to publication.
              </li>
              <li>
                <strong>Non-Partisan Objectivity:</strong> Reporting on student union elections, inter-hall forensic tournaments, and administrative policies must remain balanced, impartial, and free from external influence.
              </li>
              <li>
                <strong>Fair Hearing:</strong> Any individual or department subject to criticism or investigation in an investigative piece is afforded reasonable opportunity to respond before print.
              </li>
            </ul>
          </div>
        </section>

        {/* SECTION 2: CORRECTIONS & TRANSPARENCY PROTOCOL */}
        <section className="bg-white p-6 sm:p-8 rounded-md border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <div className="p-2.5 rounded-full bg-mcc-navy/10 text-mcc-navy">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-serif uppercase tracking-widest text-mcc-gold font-bold block">
                Standard 02
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900">
                Corrections & Retraction Protocol
              </h2>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm font-serif text-gray-800 leading-relaxed">
            <p>
              We view the admission of errors as a cornerstone of credibility. When factual misstatements occur in published dispatches, they are handled through our formal erratum procedure:
            </p>
            <ul className="space-y-2 list-disc list-inside text-gray-700 pl-2">
              <li>
                <strong>Prompt Remediation:</strong> Confirmed inaccuracies are corrected within 24 hours of notification in digital editions, with a prominent italicized editor&rsquo;s note appended to the article.
              </li>
              <li>
                <strong>Clear Erratum Notices:</strong> The note specifies what was previously published, the corrected fact, and the exact timestamp when the amendment was enacted.
              </li>
              <li>
                <strong>Full Retractions:</strong> In the rare instance where a story fails fundamental standards of verification, it is formally retracted with a signed editorial explanation.
              </li>
            </ul>
          </div>
        </section>

        {/* SECTION 3: STUDENT WHISTLEBLOWER & ANONYMOUS TIPS */}
        <section className="bg-white p-6 sm:p-8 rounded-md border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <div className="p-2.5 rounded-full bg-mcc-gold/15 text-mcc-navy">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-serif uppercase tracking-widest text-mcc-maroon font-bold block">
                Standard 03
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900">
                Source Confidentiality & Whistleblower Protection
              </h2>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm font-serif text-gray-800 leading-relaxed">
            <p>
              To protect scholars, student leaders, and faculty who report sensitive institutional concerns, <em>The MCC Chronicles</em> upholds ironclad source confidentiality.
            </p>
            <ul className="space-y-2 list-disc list-inside text-gray-700 pl-2">
              <li>
                <strong>Off-the-Record Guarantees:</strong> Information provided under non-attribution conditions will never reveal the source&rsquo;s identity to third parties or non-editorial authorities.
              </li>
              <li>
                <strong>Secure Transmissions:</strong> Anonymous tips submitted via our portal do not publish IP addresses or submitter identifiers in public gazette feeds.
              </li>
              <li>
                <strong>Protection Against Retaliation:</strong> We vigorously defend student contributors against administrative or peer reprisal for participating in legitimate journalistic inquiry.
              </li>
            </ul>
          </div>
        </section>

        {/* SECTION 4: COLOPHON & TECHNICAL ARCHITECTURE */}
        <section className="bg-white p-6 sm:p-8 rounded-md border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <div className="p-2.5 rounded-full bg-gray-100 text-gray-800">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-serif uppercase tracking-widest text-mcc-gold font-bold block">
                Standard 04
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900">
                Colophon & Technical Specifications
              </h2>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm font-serif text-gray-800 leading-relaxed">
            <p>
              <em>The MCC Chronicles</em> digital broadsheet was engineered to merge classical newspaper typographic aesthetics with modern full-stack web standards:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 font-sans">
              <div className="p-4 bg-mcc-paper rounded border border-mcc-maroon/15 space-y-1">
                <span className="text-xs font-serif font-bold uppercase tracking-wider text-mcc-maroon block">
                  Typographic Palette
                </span>
                <p className="text-xs text-gray-700">
                  Headlines & Bylines set in <strong>Playfair Display</strong> (Serif); Body prose and interface labels rendered in <strong>Inter</strong> (Sans).
                </p>
              </div>

              <div className="p-4 bg-mcc-paper rounded border border-mcc-maroon/15 space-y-1">
                <span className="text-xs font-serif font-bold uppercase tracking-wider text-mcc-navy block">
                  Engineering Stack
                </span>
                <p className="text-xs text-gray-700">
                  Built with <strong>React 18</strong>, <strong>Vite</strong>, and <strong>Tailwind CSS</strong> on the client; powered by <strong>Node.js / Express</strong> and <strong>MySQL 8.4</strong> on the server.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 5. DIRECT REPORT ACTION */}
      <div className="mt-12 p-8 bg-mcc-paper border-2 border-dashed border-mcc-maroon/30 rounded-md text-center space-y-4">
        <h3 className="font-serif text-2xl font-bold text-gray-900">
          Notice a Factual Discrepancy?
        </h3>
        <p className="text-xs sm:text-sm font-serif text-gray-600 max-w-lg mx-auto leading-relaxed">
          If you believe a published report contains inaccurate dates, names, or statements, please file a correction notice directly with our ombudsman desk.
        </p>
        <div className="pt-2">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-mcc-maroon hover:bg-mcc-maroon-dark text-white rounded text-xs font-serif font-bold uppercase tracking-wider transition-colors shadow-xs"
          >
            <Mail className="w-4 h-4" />
            <span>File a Formal Correction Notice</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
