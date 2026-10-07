import React, { useState } from 'react';
import articleService from '../../services/articleService';
import { useAuth } from '../../context/AuthContext';
import {
  Database,
  FileSpreadsheet,
  Download,
  ShieldCheck,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HardDrive,
  FileText,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function BackupConsole() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [downloadingJson, setDownloadingJson] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(null);

  // Guard for Super Admin
  if (!isSuperAdmin) {
    return (
      <div className="p-8 bg-white border-2 border-red-800 rounded-lg shadow-sm text-center font-serif">
        <Lock className="w-12 h-12 text-red-800 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900">Archival Privilege Restricted</h2>
        <p className="text-xs text-gray-600 mt-2 max-w-md mx-auto">
          The Database Snapshot & System Archival Export console is restricted strictly to Super
          Administrative personnel in compliance with MCC institutional security bylaws.
        </p>
      </div>
    );
  }

  const handleDownloadJson = async () => {
    try {
      setDownloadingJson(true);
      setError(null);
      await articleService.exportJsonBackup();
      setNotification('Institutional JSON snapshot generated and downloaded successfully.');
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Failed to export JSON backup:', err);
      setError('JSON database snapshot failed: ' + (err.message || 'Server error'));
    } finally {
      setDownloadingJson(false);
    }
  };

  const handleDownloadCsv = async () => {
    try {
      setDownloadingCsv(true);
      setError(null);
      await articleService.exportArticlesCsv();
      setNotification('RFC 4180 Articles CSV archive exported and downloaded successfully.');
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Failed to export CSV archive:', err);
      setError('Articles CSV export failed: ' + (err.message || 'Server error'));
    } finally {
      setDownloadingCsv(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. BROADCAST HEADER */}
      <div className="border-b-2 border-mcc-maroon pb-4">
        <span className="text-[11px] font-serif uppercase tracking-widest text-mcc-gold font-bold">
          Institutional Archival Infrastructure
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-black text-gray-900 tracking-tight">
          System Snapshots & Institutional Archival Exports
        </h1>
        <p className="text-xs text-gray-600 font-serif mt-0.5">
          Generate encrypted database backups and structured research archives for long-term historical preservation.
        </p>
      </div>

      {/* 2. NOTIFICATIONS & ALERTS */}
      {notification && (
        <div className="p-3.5 rounded bg-emerald-50 border-l-4 border-emerald-700 text-emerald-900 text-xs font-serif flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded bg-red-50 border-l-4 border-red-700 text-red-900 text-xs font-serif flex items-center gap-2.5 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-red-700 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. EXPORT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: FULL DATABASE JSON SNAPSHOT */}
        <div className="bg-white border-2 border-mcc-maroon/20 rounded-lg p-6 shadow-sm flex flex-col justify-between hover:border-mcc-maroon/40 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded bg-mcc-navy text-mcc-gold flex items-center justify-center shadow-xs">
                <Database className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-mcc-maroon/10 text-mcc-maroon font-bold border border-mcc-maroon/20">
                JSON v1.0 • 9 Tables
              </span>
            </div>

            <h3 className="text-lg font-serif font-bold text-gray-900 mb-2">
              Full System JSON Snapshot
            </h3>
            <p className="text-xs text-gray-600 font-serif leading-relaxed mb-4">
              Comprehensive forensic snapshot containing all 9 relational database tables (articles,
              circulars, departments, categories, comments, galleries, logs, subscribers, and inquiries).
              Sensitive credentials and cryptographic password hashes are permanently omitted and sanitized.
            </p>

            <div className="bg-[#faf8f4] border border-mcc-maroon/10 rounded p-3 text-[11px] font-serif space-y-1.5 mb-6 text-gray-700">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Database Schema:</span>
                <span className="font-mono text-mcc-navy font-bold">mcc_chronicles</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Sanitization:</span>
                <span className="text-emerald-700 font-bold">Passkey / Hash Redacted</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Audit Logging:</span>
                <span className="text-blue-700 font-bold">Automated FORENSIC Log</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadJson}
            disabled={downloadingJson}
            className="w-full py-2.5 px-4 bg-mcc-maroon hover:bg-mcc-maroon/90 text-white font-serif font-bold text-xs rounded shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Download className={`w-4 h-4 text-mcc-gold ${downloadingJson ? 'animate-bounce' : ''}`} />
            <span>{downloadingJson ? 'Generating System Snapshot...' : 'Download JSON Snapshot'}</span>
          </button>
        </div>

        {/* CARD 2: ARTICLES ARCHIVE CSV EXPORT */}
        <div className="bg-white border-2 border-mcc-maroon/20 rounded-lg p-6 shadow-sm flex flex-col justify-between hover:border-mcc-maroon/40 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded bg-emerald-900 text-emerald-300 flex items-center justify-center shadow-xs">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                RFC 4180 • Tabular
              </span>
            </div>

            <h3 className="text-lg font-serif font-bold text-gray-900 mb-2">
              Articles Archive CSV Export
            </h3>
            <p className="text-xs text-gray-600 font-serif leading-relaxed mb-4">
              Standardized CSV spreadsheet export of all editorial dispatches, investigative reports,
              and historical essays published under The MCC Chronicles banner. Formatted with escaped
              RFC 4180 parameters, joined with authors, academic departments, and categories.
            </p>

            <div className="bg-[#faf8f4] border border-mcc-maroon/10 rounded p-3 text-[11px] font-serif space-y-1.5 mb-6 text-gray-700">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Format:</span>
                <span className="font-mono text-gray-900 font-bold">text/csv (UTF-8)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Included Fields:</span>
                <span className="text-gray-700">ID, Title, Slug, Dept, Author, Views</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Compatibility:</span>
                <span className="text-emerald-700 font-bold">Excel, Numbers, BigQuery</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={downloadingCsv}
            className="w-full py-2.5 px-4 bg-mcc-navy hover:bg-mcc-navy/90 text-white font-serif font-bold text-xs rounded shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Download className={`w-4 h-4 text-emerald-300 ${downloadingCsv ? 'animate-bounce' : ''}`} />
            <span>{downloadingCsv ? 'Compiling CSV Records...' : 'Download Articles CSV'}</span>
          </button>
        </div>
      </div>

      {/* 4. INSTITUTIONAL SECURITY NOTICE */}
      <div className="bg-[#fbfaf8] border-2 border-mcc-gold/60 rounded-lg p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2 rounded bg-mcc-gold/20 text-mcc-navy flex-shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5 text-mcc-navy" />
          </div>
          <div className="space-y-1 text-xs font-serif">
            <h4 className="font-bold text-mcc-navy text-sm uppercase tracking-wide">
              Institutional Archival Security Directives
            </h4>
            <p className="text-gray-700 leading-relaxed">
              In accordance with Madras Christian College electronic record preservation statutes, every export
              operation is encrypted in transit and generates an unalterable forensic record logged to the Super
              Administrative audit stream with user credentials, time of generation, and caller IP address.
            </p>
            <p className="text-gray-500 text-[11px] font-sans pt-1">
              For off-site disaster recovery tapes or cold-storage disk replication inquiries, contact the
              Deanery of Administration & Computing Bureau.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
