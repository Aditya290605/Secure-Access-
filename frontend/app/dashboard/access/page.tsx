"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Resource, AccessDecision, UserInfo } from "@/lib/types";

const ACTIONS = ["READ", "WRITE"];

export default function TryAccessPage() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [selectedAction, setSelectedAction] = useState("READ");
  const [checking, setChecking] = useState(false);

  // Result
  const [decision, setDecision] = useState<AccessDecision | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    loadData();
  }, [router]);

  async function loadData() {
    try {
      setLoading(true);
      const [resourcesData, usersData] = await Promise.all([
        apiFetch<Resource[]>("/api/admin/resources"),
        apiFetch<UserInfo[]>("/api/admin/users"),
      ]);
      setResources(resourcesData);
      setUsers(usersData);
      if (resourcesData.length > 0) setSelectedResourceId(resourcesData[0].id);
      if (usersData.length > 0) setSelectedUserId(usersData[0].id);
      setError("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheck(e: FormEvent) {
    e.preventDefault();
    setChecking(true);
    setDecision(null);
    try {
      const result = await apiFetch<AccessDecision>(
        `/api/access/admin/check?userId=${selectedUserId}`,
        {
          method: "POST",
          body: { resourceId: selectedResourceId, action: selectedAction },
        }
      );
      setDecision(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Access check failed");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition">← Dashboard</Link>
          <h1 className="text-xl font-bold text-white">Try Access</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : (
          <>
            {/* Access Check Form */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">Check Access</h2>
              <p className="text-sm text-gray-400 mb-6">
                Select a user, resource, and action to test whether the policy engine allows or denies the request.
              </p>

              {(resources.length === 0 || users.length === 0) && (
                <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-sm">
                  {resources.length === 0 && "No resources exist. "}
                  {users.length === 0 && "No users exist. "}
                  Create them first before testing access.
                </div>
              )}

              <form onSubmit={handleCheck} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">User</label>
                    <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.email} [{u.roles.join(", ")}]
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Resource</label>
                    <select value={selectedResourceId} onChange={(e) => setSelectedResourceId(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {resources.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Action</label>
                    <select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit"
                  disabled={checking || resources.length === 0 || users.length === 0}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition">
                  {checking ? "Evaluating..." : "🔍 Check Access"}
                </button>
              </form>
            </div>

            {/* Decision Result */}
            {decision && (
              <div className={`border rounded-xl p-6 ${
                decision.allowed
                  ? "bg-green-500/5 border-green-500/30"
                  : "bg-red-500/5 border-red-500/30"
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-3xl`}>
                    {decision.allowed ? "✅" : "🚫"}
                  </span>
                  <div>
                    <h3 className={`text-xl font-bold ${
                      decision.allowed ? "text-green-400" : "text-red-400"
                    }`}>
                      {decision.decision}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {decision.userEmail} → {decision.action} → {decision.resourceName}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-900/60 rounded-lg p-4">
                  <h4 className="text-xs font-medium text-gray-400 uppercase mb-2">Reason</h4>
                  <p className={`text-sm ${decision.allowed ? "text-green-300" : "text-red-300"}`}>
                    {decision.reason}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-400">
                  <div>
                    <span className="block text-gray-500">User</span>
                    <span className="text-white">{decision.userEmail}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500">Resource</span>
                    <span className="text-white">{decision.resourceName}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500">Action</span>
                    <span className="text-white">{decision.action}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500">Evaluated At</span>
                    <span className="text-white">{new Date(decision.evaluatedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
