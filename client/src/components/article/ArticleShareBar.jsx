import React, { useState } from 'react';
import { Link2, Check, Printer, Share2 } from 'lucide-react';

/**
 * Editorial Article Share Bar supporting copy-to-clipboard,
 * WhatsApp, Twitter/X, LinkedIn, and archival print triggering.
 */
export default function ArticleShareBar({
  title = '',
  url = '',
  article = null,
  className = '',
}) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareTitle = title || 'The MCC Chronicles — Official Campus Journal';

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('Failed to copy share link:', err);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(shareTitle);

  return (
    <div className={`no-print flex items-center gap-2 py-3 border-y border-mcc-maroon/15 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs font-serif font-bold uppercase tracking-wider text-mcc-maroon mr-2">
        <Share2 className="w-3.5 h-3.5" />
        <span>Share Dispatch:</span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">

        {/* Copy Link */}
        <button
          type="button"
          onClick={handleCopyLink}
          title={copied ? 'Link Copied!' : 'Copy Article Link'}
          className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-serif transition-colors border ${
            copied
              ? 'bg-emerald-700 text-white border-emerald-700'
              : 'bg-white hover:bg-mcc-paper text-gray-800 border-gray-300 hover:border-mcc-maroon'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span className="font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Link2 className="w-3.5 h-3.5 text-mcc-maroon" />
              <span>Copy Link</span>
            </>
          )}
        </button>

        {/* WhatsApp */}
        <a
          href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Share on WhatsApp"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-serif bg-white hover:bg-[#25D366]/10 text-gray-800 border border-gray-300 hover:border-[#25D366] transition-colors"
        >
          <svg className="w-3.5 h-3.5 text-[#25D366] fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
          <span className="hidden sm:inline">WhatsApp</span>
        </a>

        {/* Twitter / X */}
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Share on X (Twitter)"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-serif bg-white hover:bg-black/5 text-gray-800 border border-gray-300 hover:border-black transition-colors"
        >
          <svg className="w-3.5 h-3.5 fill-current text-gray-900" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="hidden sm:inline">X (Twitter)</span>
        </a>

        {/* LinkedIn */}
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Share on LinkedIn"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-serif bg-white hover:bg-[#0A66C2]/10 text-gray-800 border border-gray-300 hover:border-[#0A66C2] transition-colors"
        >
          <svg className="w-3.5 h-3.5 text-[#0A66C2] fill-current" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
          </svg>
          <span className="hidden sm:inline">LinkedIn</span>
        </a>

        {/* Print Button */}
        <button
          type="button"
          onClick={handlePrint}
          title="Print Gazette Archival Copy"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-serif bg-white hover:bg-mcc-gold/15 text-gray-800 border border-gray-300 hover:border-mcc-gold transition-colors ml-auto sm:ml-0"
        >
          <Printer className="w-3.5 h-3.5 text-mcc-navy" />
          <span>Print Article</span>
        </button>
      </div>
    </div>
  );
}
