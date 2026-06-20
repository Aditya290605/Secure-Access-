"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

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

  function formatTime(ts: string) {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition">← Dashboard</Link>
            <h1 className="text-xl font-bold text-white">Audit Log</h1>
          </div>
          <button onClick={loadData}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition">
            ↻ Refresh
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
        )}

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase">Total Checks</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalChecks}</p>
            </div>
            <div className="bg-gray-900 border border-green-500/20 rounded-xl p-4">
              <p className="text-xs text-green-400 uppercase">Allowed</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{stats.allowedCount}</p>
            </div>
            <div className="bg-gray-900 border border-red-500/20 rounded-xl p-4">
              <p className="text-xs text-red-400 uppercase">Denied</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{stats.deniedCount}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase">Allow Rate</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.allowRate}%</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Decision:</label>
            <select value={filterDecision}
              onChange={(e) => { setFilterDecision(e.target.value); setPage(0); }}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All</option>
              <option value="ALLOWED">ALLOWED</option>
              <option value="DENIED">DENIED</option>
            </select>
          </div>
          {auditPage && (
            <span className="text-sm text-gray-500 ml-auto">
              {auditPage.totalElements} total entries · Page {auditPage.number + 1} of {Math.max(auditPage.totalPages, 1)}
            </span>
          )}
        </div>

        {/* Audit log table */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading audit trail...</div>
        ) : !auditPage || auditPage.content.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-gray-400">No audit entries yet. Use the &quot;Try Access&quot; page to generate some.</p>
          </div>
        ) : (
          <>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Resource</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Decision</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Reason</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {auditPage.content.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-800/50 transition">
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatTime(entry.timestamp)}</td>
                        <td className="px-4 py-3 text-sm text-white">{entry.userEmail}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{entry.resourceName}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400">
                            {entry.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            entry.decision === "ALLOWED"
                              ? "bg-green-500/10 text-green-400"
                              : "bg-red-500/10 text-red-400"
                          }`}>
                            {entry.decision}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate" title={entry.reason}>
                          {entry.reason}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 font-mono">{entry.ipAddress}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {auditPage.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-white text-sm rounded-lg transition">
                  ← Prev
                </button>
                {Array.from({ length: Math.min(auditPage.totalPages, 5) }, (_, i) => {
                  const pageNum = Math.max(0, Math.min(page - 2, auditPage.totalPages - 5)) + i;
                  if (pageNum >= auditPage.totalPages) return null;
                  return (
                    <button key={pageNum} onClick={() => setPage(pageNum)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition ${
                        pageNum === page
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                      }`}>
                      {pageNum + 1}
                    </button>
                  );
                })}
                <button onClick={() => setPage(Math.min(auditPage.totalPages - 1, page + 1))}
                  disabled={page >= auditPage.totalPages - 1}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-white text-sm rounded-lg transition">
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
