import React, { useState, useEffect } from 'react';
import articleService from '../../services/articleService';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Database,
  Lock,
  Code,
  X,
  Copy,
  Check,
  Globe,
  Terminal,
} from 'lucide-react';

const COMMON_ACTIONS = [
  { value: '', label: 'All Recorded Actions' },
  { value: 'LOGIN', label: 'LOGIN (Authentication)' },
  { value: 'ARTICLE_PUBLISH', label: 'ARTICLE_PUBLISH (Editorial Dispatches)' },
  { value: 'USER_CREATE', label: 'USER_CREATE (Staff Provisioning)' },
  { value: 'SETTINGS_UPDATE', label: 'SETTINGS_UPDATE (Governance Config)' },
  { value: 'CIRCULAR_CREATE', label: 'CIRCULAR_CREATE (Gazette Notices)' },
  { value: 'GALLERY_CREATE', label: 'GALLERY_CREATE (Media Archives)' },
  { value: 'BACKUP_EXPORT_JSON', label: 'BACKUP_EXPORT_JSON (System Export)' },
];

export default function AuditLogExplorer() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [userQuery, setUserQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  // Payload Inspection Modal
  const [selectedPayload, setSelectedPayload] = useState(null);
  const [copied, setCopied] = useState(false);

  // Super Admin security guard
  if (!isSuperAdmin) {
    return (
      <div className="p-8 bg-white border-2 border-red-800 rounded-lg shadow-sm text-center font-serif">
        <Lock className="w-12 h-12 text-red-800 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900">Archival Privilege Restricted</h2>
        <p className="text-xs text-gray-600 mt-2 max-w-md mx-auto">
          The Activity Audit & Security Trail is restricted strictly to the Super Administrative
          hierarchy in accordance with MCC institutional digital integrity directives.
        </p>
      </div>
    );
  }

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: currentPage,
        limit: pageLimit,
      };
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entity_type = entityFilter;
      if (userQuery.trim()) params.user = userQuery.trim();

      const res = await articleService.getAuditLogs(params);
      if (res && res.data) {
        setLogs(res.data);
        setTotalCount(res.pagination?.total || res.total || res.data.length);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError('Unable to load institutional security audit trail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter, currentPage, pageLimit]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLogs();
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageLimit));

  const getActionColor = (action) => {
    const act = (action || '').toUpperCase();
    if (act.includes('LOGIN')) return 'bg-blue-100 text-blue-900 border-blue-300';
    if (act.includes('PUBLISH') || act.includes('CREATE'))
      return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    if (act.includes('UPDATE') || act.includes('SETTINGS'))
      return 'bg-amber-100 text-amber-900 border-amber-300';
    if (act.includes('DELETE') || act.includes('PURGE'))
      return 'bg-red-100 text-red-900 border-red-300';
    if (act.includes('EXPORT') || act.includes('BACKUP'))
      return 'bg-purple-100 text-purple-900 border-purple-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. BROADCAST HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-mcc-maroon pb-4">
        <div>
          <span className="text-[11px] font-serif uppercase tracking-widest text-mcc-gold font-bold">
            Institutional Governance & Integrity
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-gray-900 tracking-tight">
            Activity Audit Log Explorer
          </h1>
          <p className="text-xs text-gray-600 font-serif mt-0.5">
            Immutable forensic trail tracking editorial publishing, user authorizations, and configuration updates.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-mcc-maroon/30 text-xs font-serif font-bold text-mcc-maroon hover:bg-mcc-maroon/5 rounded transition-colors self-start sm:self-auto shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit Stream</span>
        </button>
      </div>

      {/* 2. ERROR DISPLAY */}
      {error && (
        <div className="p-3 rounded bg-red-50 border-l-4 border-red-700 text-red-900 text-xs font-serif flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-700 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. FILTERS & SEARCH CONSOLE */}
      <form
        onSubmit={handleFilterSubmit}
        className="bg-white border border-mcc-maroon/20 rounded p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-serif"
      >
        {/* Action Dropdown */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-gray-600 font-bold mb-1">
            Filter by Action
          </label>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full py-1.5 px-2.5 bg-white border border-gray-300 rounded focus:border-mcc-maroon outline-hidden"
          >
            {COMMON_ACTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* Entity Type Filter */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-gray-600 font-bold mb-1">
            Entity Type
          </label>
          <input
            type="text"
            placeholder="e.g. article, user, settings"
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="w-full py-1.5 px-2.5 bg-white border border-gray-300 rounded focus:border-mcc-maroon outline-hidden placeholder:text-gray-400"
          />
        </div>

        {/* User Search Query */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-gray-600 font-bold mb-1">
            Filter by User
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="User name or email..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-gray-300 rounded focus:border-mcc-maroon outline-hidden placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Limit & Filter Action */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-[11px] uppercase tracking-wider text-gray-600 font-bold mb-1">
              Page Size
            </label>
            <select
              value={pageLimit}
              onChange={(e) => {
                setPageLimit(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2 bg-white border border-gray-300 rounded focus:border-mcc-maroon outline-hidden"
            >
              <option value="15">15 / page</option>
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 bg-mcc-navy hover:bg-mcc-maroon text-white font-bold rounded transition-colors shadow-xs"
          >
            Apply
          </button>
        </div>
      </form>

      {/* 4. AUDIT LOG STREAM TABLE */}
      <div className="bg-white border border-mcc-maroon/20 rounded shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-mcc-navy text-white font-serif uppercase tracking-wider text-[11px] border-b-2 border-mcc-gold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Entity ID</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Details Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-500 font-serif">
                    <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-mcc-maroon" />
                    Querying secure activity audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-500 font-serif">
                    <Shield className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    No audit records found matching the search criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  let formattedDetails = null;
                  try {
                    formattedDetails =
                      typeof log.details === 'string'
                        ? JSON.parse(log.details)
                        : log.details;
                  } catch {
                    formattedDetails = log.details;
                  }

                  return (
                    <tr key={log.id} className="hover:bg-[#fbfaf8] transition-colors">
                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap text-gray-600 font-serif">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {log.created_at
                              ? new Date(log.created_at).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })
                              : '—'}
                          </span>
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-serif font-bold text-gray-900 leading-tight">
                          {log.user_name || log.user_email || `User #${log.user_id || 'System'}`}
                        </div>
                        {log.user_email && log.user_name && (
                          <div className="text-[11px] text-gray-500 font-sans">{log.user_email}</div>
                        )}
                      </td>

                      {/* Action Pill */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-tight border ${getActionColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Entity Type */}
                      <td className="py-3 px-4 whitespace-nowrap font-serif text-gray-700">
                        {log.entity_type || '—'}
                      </td>

                      {/* Entity ID */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-gray-500">
                        {log.entity_id !== null && log.entity_id !== undefined ? `#${log.entity_id}` : '—'}
                      </td>

                      {/* IP Address */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-gray-500">
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-gray-400" />
                          <span>{log.ip_address || '—'}</span>
                        </div>
                      </td>

                      {/* Details Payload Viewer Button */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        {formattedDetails ? (
                          <button
                            type="button"
                            onClick={() => setSelectedPayload({ log, details: formattedDetails })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-gray-100 hover:bg-mcc-navy hover:text-white text-gray-700 font-serif text-[11px] transition-colors border border-gray-200"
                            title="Inspect JSON Payload"
                          >
                            <Code className="w-3 h-3 text-mcc-gold" />
                            <span>Payload</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-gray-400 font-serif italic">None</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. PAGINATION BAR */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs font-serif text-gray-600">
          <div>
            Page <span className="font-bold">{currentPage}</span> of{' '}
            <span className="font-bold">{totalPages}</span> ({totalCount} recorded events)
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 border border-gray-300 rounded bg-white hover:bg-gray-100 disabled:opacity-40 transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1 border border-gray-300 rounded bg-white hover:bg-gray-100 disabled:opacity-40 transition-colors flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 6. DETAILS PAYLOAD JSON INSPECTOR MODAL */}
      {/* ============================================================== */}
      {selectedPayload && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg border-2 border-mcc-maroon max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 bg-mcc-navy text-white flex items-center justify-between border-b-2 border-mcc-gold">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-mcc-gold" />
                <h3 className="font-serif font-bold text-sm">
                  Forensic Log Payload — ID #{selectedPayload.log.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayload(null)}
                className="text-gray-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-gray-50 border-b border-gray-200 text-xs font-serif flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-900">{selectedPayload.log.action}</span>
                <span className="text-gray-500 mx-2">•</span>
                <span className="text-gray-600">
                  {selectedPayload.log.created_at
                    ? new Date(selectedPayload.log.created_at).toLocaleString()
                    : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(JSON.stringify(selectedPayload.details, null, 2))
                }
                className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-gray-700 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-gray-500" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto bg-gray-900 text-emerald-400 font-mono text-xs leading-relaxed">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(selectedPayload.details, null, 2)}
              </pre>
            </div>

            <div className="p-3 bg-gray-100 border-t border-gray-200 text-right">
              <button
                type="button"
                onClick={() => setSelectedPayload(null)}
                className="px-4 py-1.5 bg-mcc-navy hover:bg-mcc-maroon text-white font-serif font-bold rounded text-xs transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
