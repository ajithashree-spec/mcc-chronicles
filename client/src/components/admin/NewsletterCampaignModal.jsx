import React, { useState } from 'react';
import { Mail, Send, X, CheckCircle, AlertCircle, Eye, Users, RefreshCw } from 'lucide-react';
import articleService from '../../services/articleService';

export default function NewsletterCampaignModal({ isOpen, onClose, onDispatched }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successResult, setSuccessResult] = useState(null);
  const [previewHtml, setPreviewHtml] = useState(null);

  if (!isOpen) return null;

  const handleDispatch = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await articleService.dispatchNewsletterDigest();
      if (res && res.success) {
        setSuccessResult(res);
        setPreviewHtml(res.digestHtml);
        if (onDispatched) onDispatched(res);
      } else {
        setError(res?.message || 'Failed to dispatch newsletter campaign');
      }
    } catch (err) {
      console.error('Failed to dispatch digest:', err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to dispatch newsletter digest to subscribers.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-serif">
      <div className="bg-white rounded-lg shadow-2xl border border-mcc-maroon/20 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-mcc-maroon text-white flex items-center justify-between border-b border-mcc-gold/30">
          <div className="flex items-center gap-2.5">
            <Mail className="w-5 h-5 text-mcc-gold" />
            <div>
              <h3 className="font-bold text-base tracking-wide">
                Morning Quadrangle Digest Campaign Desk
              </h3>
              <p className="text-[11px] text-mcc-gold/90 uppercase tracking-widest font-sans font-semibold">
                Official Broadsheet Subscriber Broadcast Dispatcher (Task 105)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs font-sans">
          {error && (
            <div className="p-3 rounded bg-red-50 border-l-4 border-red-700 text-red-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successResult ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif text-lg font-bold text-mcc-maroon">
                  Broadsheet Digest Dispatched Successfully!
                </h4>
                <p className="text-gray-600">
                  Broadcast transmitted to <strong>{successResult.recipientsCount}</strong> active newsletter subscribers.
                </p>
              </div>

              {previewHtml && (
                <div className="text-left mt-4 border border-gray-200 rounded p-4 bg-gray-50 max-h-64 overflow-y-auto">
                  <div
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                    className="transform scale-90 origin-top"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-mcc-paper rounded border border-mcc-maroon/20 flex items-start gap-3">
                <Users className="w-5 h-5 text-mcc-maroon shrink-0 mt-0.5" />
                <div className="space-y-1 font-serif">
                  <h4 className="font-bold text-sm text-mcc-navy">
                    Automated Weekly Compendium Compilation
                  </h4>
                  <p className="text-gray-700 text-xs leading-relaxed">
                    This engine queries the 5 latest published collegiate dispatches, urgent gazette notices, and institutional circulars. Each recipient receives personalized unsubscription tokens and styled broadsheet typography.
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-md p-4 bg-gray-50 text-center space-y-2">
                <p className="text-gray-600 text-xs">
                  Ready to compile and transmit this edition of <em>The Morning Quadrangle Digest</em> to all active subscribers.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 font-sans text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
          >
            {successResult ? 'Close' : 'Cancel'}
          </button>
          {!successResult && (
            <button
              type="button"
              onClick={handleDispatch}
              disabled={loading}
              className="px-5 py-2 bg-mcc-maroon hover:bg-mcc-maroon-dark text-white rounded font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-mcc-gold" />
              <span>{loading ? 'Compiling & Transmitting...' : 'Dispatch Digest Campaign'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
