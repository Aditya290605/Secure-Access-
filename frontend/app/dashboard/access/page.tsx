"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Resource, AccessDecision, UserInfo } from "@/lib/types";
import { 
  Shield, Zap, ArrowLeft, User, Database, CheckCircle, 
  XCircle, Clock, AlertTriangle, Play, Info
} from "lucide-react";

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
              <Zap className="w-4 h-4 text-blue-600" />
              Interactive Policy Tester
            </span>
          </div>
        </div>
      </header>

      {/* Main container */}
      <main className="max-w-3xl mx-auto px-6 lg:px-8 py-10">
        {error && (
          <div className="mb-6 flex items-start gap-2 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
            <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <p className="text-xs font-bold text-rose-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2 bg-white border border-slate-100 rounded-2xl shadow-sm shadow-blue-500/5">
            <span className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <span className="text-xs font-bold">Loading tester components...</span>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Access Check Form */}
            <div className="bg-white border border-slate-100 shadow-md shadow-blue-500/5 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Zap className="w-4.5 h-4.5 text-blue-600" />
                </div>
                <h2 className="text-sm font-bold text-slate-950">Check Subject Permission</h2>
              </div>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed font-semibold">
                Select a user account, target resource, and proposed action. SecureAccess will execute policy matching and output a compliance-ready explanation trace.
              </p>

              {(resources.length === 0 || users.length === 0) && (
                <div className="mb-6 flex items-start gap-2.5 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-bold text-amber-700">
                  <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    {resources.length === 0 && "No data resources registered. "}
                    {users.length === 0 && "No registered user accounts found. "}
                    You must register them in the dashboard before you can evaluate access.
                  </div>
                </div>
              )}

              <form onSubmit={handleCheck} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">User Context</label>
                    <select 
                      value={selectedUserId} 
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      disabled={users.length === 0}
                      className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition disabled:opacity-50"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.email} [{u.roles.join(", ")}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Resource Asset</label>
                    <select 
                      value={selectedResourceId} 
                      onChange={(e) => setSelectedResourceId(e.target.value)}
                      disabled={resources.length === 0}
                      className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition disabled:opacity-50"
                    >
                      {resources.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Proposed Action</label>
                    <select 
                      value={selectedAction} 
                      onChange={(e) => setSelectedAction(e.target.value)}
                      className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    >
                      {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={checking || resources.length === 0 || users.length === 0}
                    className="inline-flex items-center gap-1.5 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/10 hover:shadow-lg"
                  >
                    {checking ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Evaluating...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        Execute Policy Check
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Decision Result Card */}
            {decision && (
              <div className={`border rounded-2xl p-6 shadow-md shadow-blue-500/5 animate-fade-in-up ${
                decision.allowed
                  ? "bg-emerald-50/30 border-emerald-200 text-slate-900"
                  : "bg-rose-50/30 border-rose-200 text-slate-900"
              }`}>
                <div className="flex items-start gap-4 mb-5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                    decision.allowed
                      ? "bg-emerald-100 border-emerald-200 text-emerald-700"
                      : "bg-rose-100 border-rose-200 text-rose-700"
                  }`}>
                    {decision.allowed ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className={`text-base font-extrabold tracking-tight uppercase ${
                      decision.allowed ? "text-emerald-800" : "text-rose-800"
                    }`}>
                      Access {decision.allowed ? "ALLOWED" : "DENIED"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-semibold">
                      Subject: <span className="font-bold text-slate-700">{decision.userEmail}</span> 
                      &nbsp;• Resource: <span className="font-bold text-slate-700">{decision.resourceName}</span>
                    </p>
                  </div>
                </div>

                {/* Explanation logic block - replaced grey background with high contrast white/blue panel */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    Trace Explanation
                  </div>
                  <p className={`text-xs leading-relaxed font-bold ${decision.allowed ? "text-emerald-700" : "text-rose-700"}`}>
                    {decision.reason}
                  </p>
                </div>

                {/* Evaluated Metadata Attributes */}
                <div className="mt-5 pt-5 border-t border-slate-200/60 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">User Account</span>
                    <span className="text-slate-800 block truncate">{decision.userEmail}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Resource</span>
                    <span className="text-slate-800 block truncate">{decision.resourceName}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evaluated Action</span>
                    <span className="text-slate-800 block">{decision.action}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Evaluated At
                    </span>
                    <span className="text-slate-800 block">
                      {new Date(decision.evaluatedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
