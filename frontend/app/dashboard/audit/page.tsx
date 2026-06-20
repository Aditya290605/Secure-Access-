"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { 
  FileText, ArrowLeft, RefreshCw, AlertTriangle, 
  CheckCircle2, XCircle, Search, Calendar, ShieldCheck, 
  Database, Activity
} from "lucide-react";

interface AuditEntry {
  id: string;
  userId: string;
  userEmail: string;
  resourceId: string;
  resourceName: string;
  action: string;
  decision: string;
  reason: string;
  timestamp: string;
  ipAddress: string;
}

interface AuditPage {
  content: AuditEntry[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

interface AuditStats {
  totalChecks: number;
  allowedCount: number;
  deniedCount: number;
  allowRate: number;
}

export default function AuditPage() {
  const router = useRouter();
  const [auditPage, setAuditPage] = useState<AuditPage | null>(null);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [filterDecision, setFilterDecision] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 15;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
  }, [router]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("size", pageSize.toString());
      if (filterDecision) params.set("decision", filterDecision);

      const [logsData, statsData] = await Promise.all([
        apiFetch<AuditPage>(`/api/admin/audit/logs?${params.toString()}`),
        apiFetch<AuditStats>("/api/admin/audit/stats"),
      ]);
      setAuditPage(logsData);
      setStats(statsData);
      setError("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load audit data");
    } finally {
      setLoading(false);
    }
  }, [page, filterDecision]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) loadData();
  }, [loadData]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  function formatTime(ts: string) {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition">
              <ArrowLeft className="w-3.5 h-3.5" />
              Dashboard
            </Link>
            <span className="text-slate-300 text-sm">/</span>
            <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              Audit Log Viewer
            </span>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition border border-slate-200/60 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </header>

      {/* Main container */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {error && (
          <div className="mb-6 flex items-start gap-2 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
            <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <p className="text-xs font-bold text-rose-700">{error}</p>
          </div>
        )}

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm shadow-blue-500/5">
              <div className="flex items-center gap-2 mb-2 text-slate-400">
                <Activity className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Checks</span>
              </div>
              <p className="text-2xl font-black text-slate-950">{stats.totalChecks}</p>
            </div>

            <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm shadow-emerald-500/5">
              <div className="flex items-center gap-2 mb-2 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Allowed Checks</span>
              </div>
              <p className="text-2xl font-black text-emerald-700">{stats.allowedCount}</p>
            </div>

            <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-sm shadow-rose-500/5">
              <div className="flex items-center gap-2 mb-2 text-rose-600">
                <XCircle className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Denied Checks</span>
              </div>
              <p className="text-2xl font-black text-rose-700">{stats.deniedCount}</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm shadow-blue-500/5">
              <div className="flex items-center gap-2 mb-2 text-blue-600">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Authorization Rate</span>
              </div>
              <p className="text-2xl font-black text-slate-950">{stats.allowRate}%</p>
            </div>
          </div>
        )}

        {/* Filters control bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm shadow-blue-500/5">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Search className="w-3.5 h-3.5" />
              Filter By Decision:
            </span>
            <select 
              value={filterDecision}
              onChange={(e) => { setFilterDecision(e.target.value); setPage(0); }}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            >
              <option value="">All Decisions</option>
              <option value="ALLOWED">ALLOWED</option>
              <option value="DENIED">DENIED</option>
            </select>
          </div>
          
          {auditPage && (
            <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100/50 px-3.5 py-1.5 rounded-xl">
              {auditPage.totalElements} records · Page {auditPage.number + 1} of {Math.max(auditPage.totalPages, 1)}
            </span>
          )}
        </div>

        {/* Audit log table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2 bg-white border border-slate-100 rounded-2xl shadow-sm shadow-blue-500/5">
            <span className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <span className="text-xs font-bold">Loading audit trail...</span>
          </div>
        ) : !auditPage || auditPage.content.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm shadow-blue-500/5">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100/50">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">No Audit Entries Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-1 leading-normal font-semibold">Evaluations appear once resource permissions are checked.</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-normal">Use the Interactive Policy Tester to simulate access events.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white border border-slate-100 rounded-2xl shadow-md shadow-blue-500/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/20">
                      <th className="px-6 py-4.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Timestamp
                      </th>
                      <th className="px-6 py-4.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject context</th>
                      <th className="px-6 py-4.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Governed Resource</th>
                      <th className="px-6 py-4.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-4.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Decision</th>
                      <th className="px-6 py-4.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reason Explanation</th>
                      <th className="px-6 py-4.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditPage.content.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/30 transition">
                        <td className="px-6 py-4.5 text-xs font-semibold text-slate-500 whitespace-nowrap">
                          {formatTime(entry.timestamp)}
                        </td>
                        <td className="px-6 py-4.5">
                          <span className="text-xs font-bold text-slate-900 block truncate max-w-[160px]">{entry.userEmail}</span>
                        </td>
                        <td className="px-6 py-4.5">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700">
                            <Database className="w-3 h-3 text-slate-400" />
                            {entry.resourceName}
                          </span>
                        </td>
                        <td className="px-6 py-4.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            {entry.action}
                          </span>
                        </td>
                        <td className="px-6 py-4.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            entry.decision === "ALLOWED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}>
                            {entry.decision === "ALLOWED" ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            )}
                            {entry.decision}
                          </span>
                        </td>
                        <td className="px-6 py-4.5">
                          <span 
                            className="text-xs text-slate-500 block max-w-xs truncate font-semibold" 
                            title={entry.reason}
                          >
                            {entry.reason}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-xs font-mono text-slate-400">
                          {entry.ipAddress}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {auditPage.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button 
                  onClick={() => setPage(Math.max(0, page - 1))} 
                  disabled={page === 0}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 disabled:opacity-40 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl transition"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(auditPage.totalPages, 5) }, (_, i) => {
                  const pageNum = Math.max(0, Math.min(page - 2, auditPage.totalPages - 5)) + i;
                  if (pageNum >= auditPage.totalPages) return null;
                  return (
                    <button 
                      key={pageNum} 
                      onClick={() => setPage(pageNum)}
                      className={`w-9 h-9 text-xs font-bold rounded-xl transition ${
                        pageNum === page
                          ? "bg-blue-600 text-white"
                          : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700"
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
                
                <button 
                  onClick={() => setPage(Math.min(auditPage.totalPages - 1, page + 1))}
                  disabled={page >= auditPage.totalPages - 1}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 disabled:opacity-40 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
