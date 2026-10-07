import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  MapPin,
  Clock,
  Phone,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Building,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import articleService from '../services/articleService';

const CATEGORY_OPTIONS = [
  { value: 'editorial_tip', label: 'News Scoop & Editorial Tip' },
  { value: 'event_coverage', label: 'Request Event Coverage' },
  { value: 'general_inquiry', label: 'General Reader Inquiry' },
  { value: 'correction', label: 'Correction or Factual Clarification' },
  { value: 'grievance', label: 'Formal Feedback or Grievance' },
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'editorial_tip',
    subject: '',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string, receiptId?: number }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    // Validation
    if (!formData.name.trim()) {
      setFeedback({ type: 'error', message: 'Please enter your full name.' });
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFeedback({ type: 'error', message: 'Please provide a valid email address.' });
      return;
    }
    if (!formData.subject.trim()) {
      setFeedback({ type: 'error', message: 'Please specify the subject of your dispatch.' });
      return;
    }
    if (!formData.message.trim()) {
      setFeedback({ type: 'error', message: 'Please enter your message or tip details.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await articleService.submitContact(formData);
      const receiptId = res.data?.data?.id || Math.floor(1000 + Math.random() * 9000);

      setFeedback({
        type: 'success',
        message:
          'Your dispatch has been successfully transmitted to the MCC Chronicles editorial desk. An editor will review your submission shortly.',
        receiptId,
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        category: 'editorial_tip',
        subject: '',
        message: '',
      });
    } catch (err) {
      console.error('Contact submit error:', err);
      const errText =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Unable to send message at this time. Please verify your connection or write directly to chronicles@mcc.edu.in.';
      setFeedback({ type: 'error', message: errText });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 animate-in fade-in duration-300">
      {/* 1. BREADCRUMB */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-serif text-gray-500 mb-6">
        <Link to="/" className="hover:text-mcc-maroon transition-colors">
          Home
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-mcc-maroon font-bold font-serif">Editorial Dispatch Office & Contact</span>
      </nav>

      {/* 2. GRAND HEADER */}
      <header className="mb-10 pb-4 border-b-2 border-mcc-maroon flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-serif uppercase tracking-widest text-mcc-gold font-bold block mb-1">
            Official Campus Gazette Bureau
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-gray-950 uppercase tracking-tight">
            The Editorial Board & Dispatch Office
          </h1>
          <p className="text-sm sm:text-base font-serif italic text-gray-700 mt-2 max-w-2xl leading-relaxed">
            Reach out to the MCC Chronicles newsroom, submit news scoops, file editorial corrections, or request photographic coverage of collegiate ceremonies.
          </p>
        </div>

        <div className="md:text-right shrink-0">
          <span className="text-xs font-serif uppercase tracking-widest font-bold text-gray-600 block">
            Tambaram Newsroom
          </span>
          <span className="text-xs font-sans text-mcc-navy font-semibold">
            Miller Memorial Library Complex • Est. 1837
          </span>
        </div>
      </header>

      {/* 3. TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* LEFT COLUMN: INSTITUTIONAL DIRECTORY & GUIDELINES (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Office Details Card */}
          <div className="bg-white p-6 rounded-md border border-mcc-maroon/20 shadow-xs space-y-4">
            <h3 className="font-serif text-xl font-bold text-mcc-navy flex items-center gap-2">
              <Building className="w-5 h-5 text-mcc-maroon" />
              <span>Newsroom & Bureau Address</span>
            </h3>

            <div className="space-y-3 text-xs sm:text-sm font-sans text-gray-700 leading-relaxed">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-mcc-gold shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-900 block font-serif">The MCC Chronicles Bureau</strong>
                  <span>Miller Memorial Library Complex,</span>
                  <span className="block">Madras Christian College (Autonomous),</span>
                  <span className="block">Tambaram East, Chennai - 600 059, Tamil Nadu, India.</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <Mail className="w-4 h-4 text-mcc-gold shrink-0" />
                <div>
                  <span className="text-gray-500 text-xs block">Editorial Correspondence:</span>
                  <a
                    href="mailto:chronicles@mcc.edu.in"
                    className="font-serif font-bold text-mcc-maroon hover:underline"
                  >
                    chronicles@mcc.edu.in
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <Clock className="w-4 h-4 text-mcc-gold shrink-0" />
                <div>
                  <span className="text-gray-500 text-xs block">Operating & Review Hours:</span>
                  <span>Monday – Friday: 9:00 AM – 4:30 PM IST</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submission Guidelines Card */}
          <div className="bg-mcc-paper p-6 rounded-md border border-mcc-maroon/15 shadow-xs space-y-3">
            <h4 className="font-serif text-base font-bold text-mcc-navy flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-mcc-gold" />
              <span>Submission Ethics & Privacy</span>
            </h4>
            <ul className="text-xs font-serif text-gray-700 space-y-2 list-disc list-inside leading-relaxed">
              <li>
                <strong>Whistleblower Protection:</strong> Confidential news tips are handled with journalistic discretion under the supervision of faculty advisors.
              </li>
              <li>
                <strong>Student Scoops & Articles:</strong> Essays, op-eds, and campus event recaps must be original works attributed to bona fide MCC scholars or alumni.
              </li>
              <li>
                <strong>Corrections:</strong> Factual errors in published gazette editions are reviewed promptly and corrected in the archival record with an erratum notice.
              </li>
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN: SUBMISSION FORM (7 COLS) */}
        <div className="lg:col-span-7">
          <div className="bg-white p-6 sm:p-8 rounded-md border border-mcc-maroon/20 shadow-xs">
            <h3 className="font-serif text-2xl font-bold text-gray-950 mb-1">
              File a Dispatch or Reader Tip
            </h3>
            <p className="text-xs sm:text-sm font-serif text-gray-600 mb-6 leading-relaxed">
              Complete the dispatch form below to communicate with the editorial team. Fields marked with <span className="text-mcc-maroon font-bold">*</span> are required.
            </p>

            {/* FEEDBACK BANNER */}
            {feedback && (
              <div
                className={`mb-6 p-4 rounded-md text-xs sm:text-sm font-serif leading-relaxed flex items-start gap-3 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-950 border border-emerald-300'
                    : 'bg-red-50 text-red-950 border border-red-300'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{feedback.message}</p>
                  {feedback.receiptId && (
                    <p className="text-xs font-mono text-emerald-800 mt-1">
                      Receipt Confirmation Ref: #MCC-DSP-{feedback.receiptId}
                    </p>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label
                    htmlFor="contact_name"
                    className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-700 mb-1"
                  >
                    Full Name <span className="text-mcc-maroon">*</span>
                  </label>
                  <input
                    type="text"
                    id="contact_name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Paul Anderson '92"
                    className="w-full text-xs font-sans px-3.5 py-2.5 bg-mcc-paper/30 border border-gray-300 rounded focus:outline-hidden focus:ring-1 focus:ring-mcc-maroon focus:border-mcc-maroon"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="contact_email"
                    className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-700 mb-1"
                  >
                    Email Address <span className="text-mcc-maroon">*</span>
                  </label>
                  <input
                    type="email"
                    id="contact_email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="w-full text-xs font-sans px-3.5 py-2.5 bg-mcc-paper/30 border border-gray-300 rounded focus:outline-hidden focus:ring-1 focus:ring-mcc-maroon focus:border-mcc-maroon"
                    required
                  />
                </div>
              </div>

              {/* Category Dropdown */}
              <div>
                <label
                  htmlFor="contact_category"
                  className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-700 mb-1"
                >
                  Inquiry / Dispatch Category <span className="text-mcc-maroon">*</span>
                </label>
                <select
                  id="contact_category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full text-xs font-serif px-3.5 py-2.5 bg-mcc-paper/30 border border-gray-300 rounded focus:outline-hidden focus:ring-1 focus:ring-mcc-maroon focus:border-mcc-maroon"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label
                  htmlFor="contact_subject"
                  className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-700 mb-1"
                >
                  Subject Line <span className="text-mcc-maroon">*</span>
                </label>
                <input
                  type="text"
                  id="contact_subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Summary of news scoop, inquiry topic, or article title..."
                  className="w-full text-xs font-sans px-3.5 py-2.5 bg-mcc-paper/30 border border-gray-300 rounded focus:outline-hidden focus:ring-1 focus:ring-mcc-maroon focus:border-mcc-maroon"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="contact_message"
                  className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-700 mb-1"
                >
                  Message or Dispatch Details <span className="text-mcc-maroon">*</span>
                </label>
                <textarea
                  id="contact_message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Provide comprehensive details, dates, sources, and context for the editorial board..."
                  className="w-full text-xs font-sans px-3.5 py-2.5 bg-mcc-paper/30 border border-gray-300 rounded focus:outline-hidden focus:ring-1 focus:ring-mcc-maroon focus:border-mcc-maroon resize-y"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-mcc-maroon hover:bg-mcc-maroon-dark text-white rounded text-xs font-serif font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Transmitting to Newsroom...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Editorial Dispatch</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
