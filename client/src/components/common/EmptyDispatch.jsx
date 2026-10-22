import React from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, Building2, ArrowRight } from 'lucide-react';

/**
 * Standard Institutional Empty-State Component for The MCC Chronicles
 * Used across Department Bureaus and Category Archives when zero dispatches exist.
 *
 * @param {Object} props
 * @param {string} [props.bureau] - Optional bureau or department name
 * @param {string} [props.message] - Custom title (default: "No Dispatches Filed Under This Desk Yet")
 * @param {string} [props.subtext] - Custom explanation
 */
export default function EmptyDispatch({
  bureau = null,
  message = 'No Dispatches Filed Under This Desk Yet',
  subtext = null,
}) {
  const displaySubtext =
    subtext ||
    (bureau
      ? `Our student correspondents and faculty editors are currently assembling dispatches for ${bureau}. Please check back shortly.`
      : 'Our student correspondents and faculty editors are currently assembling dispatches for this section. Please check back shortly.');

  return (
    <div className="text-center py-16 px-6 bg-[#FAF8F5] rounded-lg border border-dashed border-[#C5A059]/60 max-w-2xl mx-auto shadow-xs my-8 animate-in fade-in duration-300">
      <div className="w-14 h-14 rounded-full bg-[#7B1113]/10 text-[#7B1113] flex items-center justify-center mx-auto mb-4 border border-[#C5A059]/30">
        <FolderOpen className="w-7 h-7 text-[#7B1113]" />
      </div>

      <h3 className="font-serif text-2xl font-bold text-[#0F2537]">
        {message}
      </h3>

      <p className="text-sm font-serif text-gray-600 mt-2 leading-relaxed max-w-xl mx-auto">
        {displaySubtext}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/departments"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F2537] text-white font-sans uppercase tracking-wider text-xs font-bold rounded hover:bg-[#7B1113] transition-colors shadow-xs"
        >
          <Building2 className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>Browse 38 Department Bureaus</span>
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[#C5A059] text-[#7B1113] font-sans uppercase tracking-wider text-xs font-bold rounded hover:bg-[#FAF8F5] transition-colors shadow-xs"
        >
          <span>Return to Front Page</span>
        </Link>
      </div>
    </div>
  );
}
