import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Square, Gauge, Radio } from 'lucide-react';

export default function ArticleAudioPlayer({ title, summary, content, authorName }) {
  const [supported, setSupported] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1.0);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSupported(false);
      return;
    }

    return () => {
      // Cancel speech when navigating away
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!supported) {
    return null;
  }

  // Strip html tags and markdown symbols for clean oral narration
  const getReadableText = () => {
    const raw = `${title}. ${summary || ''}. ${content || ''}`;
    return raw
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/[#*`_~>[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handlePlay = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();

    const text = getReadableText();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.pause();
    setIsPlaying(false);
    setIsPaused(true);
  };

  const handleStop = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleRateChange = (newRate) => {
    setRate(newRate);
    if (isPlaying) {
      // Re-trigger with new rate
      handleStop();
      setTimeout(handlePlay, 100);
    }
  };

  return (
    <div className="no-print mb-8 p-4 rounded-md border border-mcc-maroon/20 bg-mcc-paper shadow-2xs font-serif">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Title & Status Beacon */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-mcc-maroon text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Radio className={`w-4 h-4 ${isPlaying ? 'animate-pulse text-mcc-gold' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-mcc-navy">
                Broadsheet Audio Dispatch
              </span>
              {isPlaying && (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-100 font-sans font-bold px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                  Narrating
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-600 italic">
              Oral synthesis for accessibility • {authorName ? `Dispatched by ${authorName}` : 'MCC Copy Desk'}
            </p>
          </div>
        </div>

        {/* Playback Controls & Rate Selector */}
        <div className="flex items-center gap-3 font-sans text-xs">
          {/* Rate Selector */}
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-1.5 py-0.5 shadow-2xs">
            <Gauge className="w-3 h-3 text-gray-500" />
            <select
              value={rate}
              onChange={(e) => handleRateChange(parseFloat(e.target.value))}
              className="text-[11px] font-bold text-gray-700 bg-transparent outline-none cursor-pointer"
              title="Narration Playback Rate"
            >
              <option value="0.8">0.8x</option>
              <option value="1.0">1.0x</option>
              <option value="1.2">1.2x</option>
              <option value="1.5">1.5x</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {!isPlaying ? (
              <button
                type="button"
                onClick={handlePlay}
                className="px-3 py-1.5 bg-mcc-maroon hover:bg-mcc-maroon-dark text-white rounded font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                title={isPaused ? 'Resume Narration' : 'Listen to Article'}
              >
                <Play className="w-3.5 h-3.5 fill-mcc-gold text-mcc-gold" />
                <span>{isPaused ? 'Resume' : 'Listen'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePause}
                className="px-3 py-1.5 bg-mcc-navy hover:bg-mcc-navy-dark text-white rounded font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                title="Pause Narration"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            )}

            {(isPlaying || isPaused) && (
              <button
                type="button"
                onClick={handleStop}
                className="p-1.5 text-gray-600 hover:text-red-700 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                title="Stop Narration"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
