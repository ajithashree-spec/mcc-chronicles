import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, ArrowLeft, Mail, Home } from 'lucide-react';
import articleService from '../services/articleService';

export default function Unsubscribe() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function handleUnsubscribe() {
      if (!token) {
        setStatus('error');
        setMessage('Missing or invalid unsubscribe token.');
        return;
      }

      try {
        const res = await articleService.unsubscribeNewsletter(token);
        if (!isMounted) return;
        setStatus('success');
        setMessage(
          res.data?.message ||
            'You have been successfully unsubscribed from the MCC Chronicles digital digest.'
        );
      } catch (err) {
        console.error('Unsubscribe error:', err);
        if (!isMounted) return;
        setStatus('error');
        setMessage(
          err.response?.data?.error ||
            'The unsubscribe link is invalid or has expired. You may already be unsubscribed.'
        );
      }
    }

    handleUnsubscribe();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center animate-in fade-in duration-300">
      <div className="bg-white p-8 sm:p-10 rounded-md border border-mcc-maroon/20 shadow-xs space-y-6">
        <span className="text-xs font-serif uppercase tracking-widest text-mcc-gold font-bold block">
          Collegiate Dispatch Registry
        </span>

        {status === 'loading' ? (
          <div className="space-y-4 py-8">
            <div className="w-10 h-10 border-3 border-mcc-maroon border-t-transparent rounded-full animate-spin mx-auto" />
            <h2 className="font-serif text-2xl font-bold text-gray-900">
              Updating Gazette Subscription...
            </h2>
            <p className="text-xs font-serif text-gray-500">
              Communicating with the MCC Chronicles registrar.
            </p>
          </div>
        ) : status === 'success' ? (
          <div className="space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
            <h2 className="font-serif text-3xl font-bold text-gray-950">
              Unsubscribed from Digest
            </h2>
            <p className="text-sm font-serif text-gray-600 leading-relaxed max-w-md mx-auto">
              {message}
            </p>
            <p className="text-xs text-gray-500 font-sans italic pt-2">
              We regret to see you depart. You are always welcome to rejoin our weekly circulation or browse our broadsheet archives online.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AlertTriangle className="w-16 h-16 text-amber-600 mx-auto" />
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-950">
              Notice of Invalidation
            </h2>
            <p className="text-sm font-serif text-gray-600 leading-relaxed max-w-md mx-auto">
              {message}
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-gray-100 flex items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-mcc-maroon hover:bg-mcc-maroon-dark text-white rounded text-xs font-serif font-bold uppercase tracking-wider transition-colors shadow-xs"
          >
            <Home className="w-4 h-4" />
            <span>Return to Front Page</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
