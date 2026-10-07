import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, CheckCircle2, AlertCircle, Clock, User, ShieldCheck } from 'lucide-react';
import { articleService } from '../../services/articleService';

/**
 * Format timestamp into broadsheet newspaper date.
 */
function formatCommentDate(dateStr) {
  if (!dateStr) return 'Just now';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Recently';
  }
}

export default function CommentSection({ articleId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  // Form State
  const [formData, setFormData] = useState({
    author_name: '',
    author_email: '',
    content: '',
  });

  // Fetch comments on mount or articleId change
  useEffect(() => {
    let isMounted = true;
    if (!articleId) return;

    async function loadComments() {
      setLoading(true);
      try {
        const res = await articleService.getArticleComments(articleId);
        if (isMounted && res.data) {
          // If response format is { success: true, data: [...] }
          const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
          setComments(list);
        }
      } catch (err) {
        console.error('Failed to load article comments:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadComments();

    return () => {
      isMounted = false;
    };
  }, [articleId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    // Basic client validation
    if (!formData.author_name.trim()) {
      setFeedback({ type: 'error', message: 'Please enter your name.' });
      return;
    }
    if (!formData.author_email.trim() || !formData.author_email.includes('@')) {
      setFeedback({ type: 'error', message: 'Please provide a valid email address.' });
      return;
    }
    if (!formData.content.trim()) {
      setFeedback({ type: 'error', message: 'Comment text cannot be empty.' });
      return;
    }

    setSubmitting(true);

    try {
      const res = await articleService.submitArticleComment(articleId, formData);
      
      // Clear form
      setFormData({
        author_name: '',
        author_email: '',
        content: '',
      });

      setFeedback({
        type: 'success',
        message: 'Thank you for your correspondence. Your comment has been submitted to the editorial desk for moderation.',
      });

      // If backend auto-approved the comment, add it to list
      if (res.data && (res.data.is_approved === 1 || res.data.status === 'approved')) {
        setComments((prev) => [res.data, ...prev]);
      }
    } catch (err) {
      console.error('Comment submission error:', err);
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Unable to submit comment at this time. Please check your connection and try again.';
      setFeedback({ type: 'error', message: errMsg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="no-print mt-12 pt-8 border-t-2 border-mcc-maroon/20" id="comments">
      {/* SECTION HEADER */}
      <div className="flex items-center justify-between mb-8 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-5 h-5 text-mcc-maroon" />
          <h3 className="font-serif text-2xl font-bold text-gray-900 tracking-tight">
            Dispatches & Reader Correspondence
          </h3>
        </div>
        <span className="text-xs font-serif uppercase tracking-widest font-bold px-2.5 py-1 bg-mcc-maroon/10 text-mcc-maroon rounded">
          {comments.length} {comments.length === 1 ? 'Dispatch' : 'Dispatches'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* COMMENT FORM (COLUMN 1 ON DESKTOP) */}
        <div className="lg:col-span-5 order-2 lg:order-1">
          <div className="bg-white p-6 rounded-md border border-mcc-maroon/15 shadow-xs sticky top-24">
            <h4 className="font-serif text-lg font-bold text-mcc-navy mb-1">
              Add to the Campus Record
            </h4>
            <p className="text-xs font-serif text-gray-600 mb-5 leading-relaxed">
              We welcome thoughtful reflections, historical context, and civil discussion from MCCians, faculty, and readers.
            </p>

            {/* FEEDBACK ALERT */}
            {feedback && (
              <div
                className={`mb-5 p-3.5 rounded text-xs font-serif leading-relaxed flex items-start gap-2.5 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-red-50 text-red-900 border border-red-200'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="author_name"
                  className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-700 mb-1"
                >
                  Your Name <span className="text-mcc-maroon">*</span>
                </label>
                <input
                  type="text"
                  id="author_name"
                  name="author_name"
                  value={formData.author_name}
                  onChange={handleChange}
                  placeholder="e.g. Samuel Henderson '88 / Alumnus"
                  className="w-full text-xs font-sans px-3 py-2 border border-gray-300 rounded focus:outline-hidden focus:ring-1 focus:ring-mcc-maroon focus:border-mcc-maroon bg-mcc-paper/30"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="author_email"
                  className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-700 mb-1"
                >
                  Email Address <span className="text-mcc-maroon">*</span>
                </label>
                <input
                  type="email"
                  id="author_email"
                  name="author_email"
                  value={formData.author_email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  className="w-full text-xs font-sans px-3 py-2 border border-gray-300 rounded focus:outline-hidden focus:ring-1 focus:ring-mcc-maroon focus:border-mcc-maroon bg-mcc-paper/30"
                  required
                />
                <span className="text-[11px] font-sans text-gray-500 mt-1 block">
                  Your email will remain strictly confidential and will not be published.
                </span>
              </div>

              <div>
                <label
                  htmlFor="content"
                  className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-700 mb-1"
                >
                  Your Reflection or Dispatch <span className="text-mcc-maroon">*</span>
                </label>
                <textarea
                  id="content"
                  name="content"
                  rows={4}
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Share your thoughts on this story or archival dispatch..."
                  className="w-full text-xs font-sans px-3 py-2 border border-gray-300 rounded focus:outline-hidden focus:ring-1 focus:ring-mcc-maroon focus:border-mcc-maroon bg-mcc-paper/30 resize-y"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-500 font-sans">
                <ShieldCheck className="w-3.5 h-3.5 text-mcc-gold shrink-0" />
                <span>Submissions are moderated per MCC editorial guidelines.</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-mcc-maroon hover:bg-mcc-maroon-dark text-white rounded text-xs font-serif font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Transmitting Dispatch...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Correspondence</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* COMMENTS STREAM (COLUMN 2 ON DESKTOP) */}
        <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
          {loading ? (
            /* Loading Skeletons */
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="p-4 bg-white rounded border border-gray-200 animate-pulse space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                    <div className="space-y-1">
                      <div className="w-32 h-3 bg-gray-200 rounded" />
                      <div className="w-20 h-2 bg-gray-200 rounded" />
                    </div>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded" />
                  <div className="w-4/5 h-3 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12 px-6 bg-white rounded-md border border-dashed border-gray-300">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h4 className="font-serif text-base font-bold text-gray-800">
                No Reader Dispatches Filed Yet
              </h4>
              <p className="text-xs font-serif text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Be the first to record your commentary or reminiscence on this gazette report.
              </p>
            </div>
          ) : (
            /* List of Comments */
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-5 bg-white rounded-md border border-gray-200 hover:border-mcc-maroon/30 transition-colors shadow-xs"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-mcc-navy text-mcc-gold font-serif font-bold text-xs flex items-center justify-center shadow-xs">
                        {(comment.author_name || 'R')[0].toUpperCase()}
                      </div>
                      <div>
                        <h5 className="font-serif text-sm font-bold text-gray-900 leading-tight">
                          {comment.author_name}
                        </h5>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-sans mt-0.5">
                          <Clock className="w-3 h-3 text-mcc-gold" />
                          <span>{formatCommentDate(comment.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-serif uppercase tracking-wider font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Approved Record
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-serif text-gray-800 leading-relaxed pl-11 whitespace-pre-line">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
