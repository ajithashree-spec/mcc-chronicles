import React, { useState, useEffect } from 'react';
import articleService from '../../services/articleService';
import {
  BarChart3,
  Vote,
  CheckCircle2,
  AlertCircle,
  Radio,
  Clock,
  Sparkles,
  Users,
} from 'lucide-react';

export default function PollWidget({ className = '' }) {
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [voted, setVoted] = useState(false);

  const fetchActivePoll = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await articleService.getActivePoll();
      if (res && res.data) {
        setPoll(res.data);
        if (res.data.has_voted) {
          setVoted(true);
          setSelectedOption(res.data.user_voted_option);
        }
      }
    } catch (err) {
      console.warn('Unable to load active poll:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivePoll();
  }, []);

  const handleVoteSubmit = async (e) => {
    e.preventDefault();
    if (selectedOption === null || !poll) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await articleService.castPollVote(poll.id, selectedOption);
      if (res && res.data) {
        setPoll(res.data);
        setVoted(true);
      }
    } catch (err) {
      console.error('Failed to submit poll vote:', err);
      if (err.response?.status === 409) {
        setError('Your vote was already registered from this terminal address.');
        setVoted(true);
      } else {
        setError(err.response?.data?.error || 'Vote submission failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-5 rounded bg-[#fbfaf8] border-2 border-mcc-gold/60 shadow-xs font-serif ${className}`}>
        <div className="flex items-center gap-2 text-mcc-gold animate-pulse text-xs uppercase tracking-wider font-bold">
          <Clock className="w-3.5 h-3.5" />
          <span>Consulting campus barometer...</span>
        </div>
      </div>
    );
  }

  if (!poll) {
    return null; // No active poll to display
  }

  return (
    <div
      className={`p-5 rounded bg-[#fbfaf8] border-2 border-mcc-gold shadow-sm font-serif relative overflow-hidden ${className}`}
    >
      {/* Decorative Broadsheet Corner Stamping */}
      <div className="absolute top-0 right-0 w-8 h-8 bg-mcc-gold/15 rotate-45 transform translate-x-4 -translate-y-4" />

      {/* 1. WIDGET MASTHEAD HEADER */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-mcc-maroon/20 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-mcc-maroon text-mcc-gold flex items-center justify-center shadow-xs">
            <BarChart3 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-serif font-black text-xs uppercase tracking-wider text-mcc-maroon">
              The Campus Barometer
            </h3>
            <span className="text-[10px] text-gray-500 font-serif block">
              Reader Opinion Poll
            </span>
          </div>
        </div>

        {/* Live Pulse Indicator */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-[10px] text-emerald-800 font-sans font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
          <span>Active</span>
        </div>
      </div>

      {/* 2. QUESTION STATEMENT */}
      <h4 className="font-serif font-bold text-gray-900 text-base leading-snug mb-4">
        {poll.question}
      </h4>

      {/* 3. ERROR / NOTIFICATION BANNER */}
      {error && (
        <div className="mb-3 p-2.5 rounded bg-amber-50 border-l-4 border-amber-600 text-amber-900 text-xs font-serif flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4. VOTING STATE OR RESULTS BREAKDOWN */}
      {!voted ? (
        <form onSubmit={handleVoteSubmit} className="space-y-2.5">
          {poll.options.map((option, idx) => (
            <label
              key={idx}
              className={`flex items-center gap-3 p-2.5 rounded border transition-all cursor-pointer text-xs font-serif ${
                selectedOption === idx
                  ? 'bg-mcc-maroon/10 border-mcc-maroon font-bold text-mcc-navy shadow-xs'
                  : 'bg-white border-gray-200 hover:border-mcc-maroon/40 text-gray-800'
              }`}
            >
              <input
                type="radio"
                name="poll-option"
                checked={selectedOption === idx}
                onChange={() => setSelectedOption(idx)}
                className="w-3.5 h-3.5 text-mcc-maroon accent-mcc-maroon focus:ring-mcc-maroon"
              />
              <span>{option}</span>
            </label>
          ))}

          <button
            type="submit"
            disabled={selectedOption === null || submitting}
            className="w-full mt-3 py-2 px-4 bg-mcc-maroon hover:bg-mcc-maroon/90 text-white font-serif font-bold text-xs rounded shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40"
          >
            <Vote className={`w-3.5 h-3.5 text-mcc-gold ${submitting ? 'animate-spin' : ''}`} />
            <span>{submitting ? 'Recording Vote...' : 'Cast Dispatch Vote'}</span>
          </button>
        </form>
      ) : (
        /* RESULTS BAR BREAKDOWN */
        <div className="space-y-3 pt-1">
          {poll.results.map((res, idx) => {
            const isUserChoice = poll.user_voted_option === res.option_index;
            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-serif">
                  <span className={`flex items-center gap-1.5 ${isUserChoice ? 'font-bold text-mcc-maroon' : 'text-gray-800'}`}>
                    {res.option}
                    {isUserChoice && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-mcc-maroon text-white font-sans font-bold">
                        Your Vote
                      </span>
                    )}
                  </span>
                  <span className="font-sans font-bold text-gray-700">
                    {res.percentage}%{' '}
                    <span className="text-[10px] font-normal text-gray-500">
                      ({res.votes})
                    </span>
                  </span>
                </div>

                {/* Progress Track */}
                <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isUserChoice ? 'bg-mcc-maroon' : 'bg-mcc-gold'
                    }`}
                    style={{ width: `${res.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}

          {/* Total Campus Votes Tally */}
          <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500 font-sans">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-mcc-maroon" />
              <span>Total Campus Dispatches:</span>
            </div>
            <span className="font-bold text-gray-800">{poll.total_votes} votes</span>
          </div>
        </div>
      )}
    </div>
  );
}
