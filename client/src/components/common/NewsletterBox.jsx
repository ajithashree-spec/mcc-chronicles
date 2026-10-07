import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, Send, Sparkles, ShieldCheck } from 'lucide-react';
import articleService from '../../services/articleService';

const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly Gazette' },
  { value: 'daily', label: 'Daily Brief' },
  { value: 'monthly', label: 'Monthly Digest' },
];

export default function NewsletterBox({ className = '', variant = 'card' }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('weekly');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (!email.trim() || !email.includes('@')) {
      setFeedback({ type: 'error', message: 'Please provide a valid email address.' });
      return;
    }

    setLoading(true);
    try {
      const res = await articleService.subscribeNewsletter(email.trim(), name.trim() || null, frequency);
      setFeedback({
        type: 'success',
        message:
          res.data?.message ||
          'Subscription confirmed! You will now receive The Morning Quadrangle Digest.',
      });
      setEmail('');
      setName('');
    } catch (err) {
      console.error('Newsletter subscribe error:', err);
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Unable to subscribe at this moment. Please check your connection and try again.';
      setFeedback({ type: 'error', message: errMsg });
    } finally {
      setLoading(false);
    }
  };

  const isFooter = variant === 'footer';

  return (
    <div
      className={`relative rounded-md border ${
        isFooter
          ? 'bg-mcc-navy/90 border-mcc-gold/30 p-5 text-white'
          : 'bg-white border-mcc-maroon/30 p-6 sm:p-8 shadow-xs'
      } ${className}`}
    >
      {/* Ornate Gold Top Rule */}
      <div className="absolute top-0 left-6 right-6 h-0.5 bg-mcc-gold" />

      <div className="space-y-3">
        {/* Kicker */}
        <div className="flex items-center gap-1.5 text-xs font-serif uppercase tracking-widest font-bold">
          <Sparkles className="w-3.5 h-3.5 text-mcc-gold" />
          <span className={isFooter ? 'text-mcc-gold' : 'text-mcc-maroon'}>
            The Morning Quadrangle Digest
          </span>
        </div>

        {/* Headline */}
        <h3
          className={`font-serif text-xl sm:text-2xl font-bold tracking-tight ${
            isFooter ? 'text-white' : 'text-gray-950'
          }`}
        >
          Curated Campus Dispatches in Your Inbox
        </h3>

        {/* Subhead */}
        <p
          className={`text-xs sm:text-sm font-serif leading-relaxed ${
            isFooter ? 'text-white/80' : 'text-gray-600'
          }`}
        >
          Receive our weekly selection of investigative dispatches, official examination schedules, botanical research, and DeepWoods announcements every Monday morning.
        </p>

        {/* Feedback message */}
        {feedback && (
          <div
            className={`p-3 rounded text-xs font-serif leading-relaxed flex items-start gap-2 ${
              feedback.type === 'success'
                ? isFooter
                  ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-500/50'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : isFooter
                ? 'bg-red-900/60 text-red-200 border border-red-500/50'
                : 'bg-red-50 text-red-900 border border-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {/* Frequency Toggle Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[11px] font-serif uppercase tracking-wider font-bold mr-1 ${
                isFooter ? 'text-white/60' : 'text-gray-500'
              }`}
            >
              Frequency:
            </span>
            {FREQUENCIES.map((freq) => (
              <button
                key={freq.value}
                type="button"
                onClick={() => setFrequency(freq.value)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-serif transition-colors border ${
                  frequency === freq.value
                    ? isFooter
                      ? 'bg-mcc-gold text-mcc-navy font-bold border-mcc-gold'
                      : 'bg-mcc-maroon text-white font-bold border-mcc-maroon'
                    : isFooter
                    ? 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {freq.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name (Optional)"
              className={`px-3 py-2 text-xs font-sans rounded border focus:outline-hidden sm:w-1/3 ${
                isFooter
                  ? 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-mcc-gold'
                  : 'bg-mcc-paper/30 border-gray-300 text-gray-900 focus:border-mcc-maroon'
              }`}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address..."
              required
              className={`px-3 py-2 text-xs font-sans rounded border focus:outline-hidden flex-1 ${
                isFooter
                  ? 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-mcc-gold'
                  : 'bg-mcc-paper/30 border-gray-300 text-gray-900 focus:border-mcc-maroon'
              }`}
            />
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-serif font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50 cursor-pointer shrink-0 ${
                isFooter
                  ? 'bg-mcc-gold hover:bg-amber-400 text-mcc-navy'
                  : 'bg-mcc-maroon hover:bg-mcc-maroon-dark text-white'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Enlisting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Subscribe</span>
                </>
              )}
            </button>
          </div>

          <p
            className={`text-[11px] font-sans flex items-center gap-1 ${
              isFooter ? 'text-white/60' : 'text-gray-500'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-mcc-gold shrink-0" />
            <span>
              Zero spam. You may cancel subscription anytime with a single click.
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}
