"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Policy, Resource } from "@/lib/types";
import { 
  Lock, Plus, Trash2, ArrowLeft, Shield, 
  User, CheckCircle, FileText, AlertTriangle, Eye
} from "lucide-react";

const ROLES = ["ADMIN", "EDITOR", "VIEWER"];
const PERMISSIONS = ["READ", "WRITE", "DENY"];

export default function PoliciesPage() {
  const router = useRouter();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [role, setRole] = useState("VIEWER");
  const [resourceId, setResourceId] = useState("");
  const [permission, setPermission] = useState("READ");
  const [conditionExpression, setConditionExpression] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    loadData();
  }, [router]);

  async function loadData() {
    try {
      setLoading(true);
      const [policiesData, resourcesData] = await Promise.all([
        apiFetch<Policy[]>("/api/admin/policies"),
        apiFetch<Resource[]>("/api/admin/resources"),
      ]);
      setPolicies(policiesData);
      setResources(resourcesData);
      if (resourcesData.length > 0 && !resourceId) {
        setResourceId(resourcesData[0].id);
      }
      setError("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await apiFetch("/api/admin/policies", {
        method: "POST",
        body: {
          role,
          resourceId,
          permission,
          conditionExpression: conditionExpression || null,
        },
      });
      setRole("VIEWER"); setPermission("READ"); setConditionExpression("");
      setShowForm(false);
      await loadData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create policy");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this access policy?")) return;
    try {
      await apiFetch(`/api/admin/policies/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  const permissionBadge = (perm: string) => {
    switch (perm) {
      case "READ":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle className="w-3 h-3" />
            READ
          </span>
        );
      case "WRITE":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
            <Plus className="w-3 h-3" />
            WRITE
          </span>
        );
      case "DENY":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
            <AlertTriangle className="w-3 h-3" />
            DENY
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-slate-50 text-slate-700 border border-slate-100">
            {perm}
          </span>
        );
    }
  };

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
              <Lock className="w-4 h-4 text-blue-600" />
              Access Policies
            </span>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setFormError("");
            }}
            className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/10 hover:shadow-lg"
          >
            {showForm ? "Cancel" : (
              <>
                <Plus className="w-3.5 h-3.5" />
                Configure Policy
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {error && (
          <div className="mb-6 flex items-start gap-2 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
            <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <p className="text-xs font-bold text-rose-700">{error}</p>
          </div>
        )}

        {/* Create Policy card */}
        {showForm && (
          <div className="mb-8 bg-white border border-slate-100 shadow-md shadow-blue-500/5 rounded-2xl p-6 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Lock className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <h2 className="text-sm font-bold text-slate-950">Define Access Control Policy</h2>
            </div>

            {resources.length === 0 && (
              <div className="mb-4 flex items-start gap-2.5 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs font-semibold text-amber-700">
                  No data assets exist in the system yet. You must{" "}
                  <Link href="/dashboard/resources" className="underline font-bold hover:text-amber-800">
                    register a resource first
                  </Link>{" "}
                  before configuring its policies.
                </p>
              </div>
            )}

            {formError && (
              <div className="mb-4 flex items-start gap-2 p-3.5 bg-rose-50 border border-rose-100 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                <p className="text-xs font-bold text-rose-700">{formError}</p>
              </div>
            )}

            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Administrative Role</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Target Data Resource</label>
                <select 
                  value={resourceId} 
                  onChange={(e) => setResourceId(e.target.value)}
                  disabled={resources.length === 0}
                  className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition disabled:opacity-50"
                >
                  {resources.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Access Permission</label>
                <select 
                  value={permission} 
                  onChange={(e) => setPermission(e.target.value)}
                  className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                >
                  {PERMISSIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Evaluation Condition (optional)</label>
                <input 
                  value={conditionExpression} 
                  onChange={(e) => setConditionExpression(e.target.value)}
                  className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  placeholder="e.g. owner_only, business_hours" 
                />
              </div>

              <div className="md:col-span-2 pt-2">
                <button 
                  type="submit" 
                  disabled={submitting || resources.length === 0}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/10 hover:shadow-lg"
                >
                  {submitting ? "Saving Policy..." : "Create Policy"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Policies list container */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2 bg-white border border-slate-100 rounded-2xl shadow-sm shadow-blue-500/5">
            <span className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <span className="text-xs font-bold">Loading access rules...</span>
          </div>
        ) : policies.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm shadow-blue-500/5 animate-fade-in">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100/50">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">No Access Policies Configured</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 leading-normal font-semibold">Configure permission rules mapping roles to resources. The engine enforces these rules with deny-wins semantics.</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/10 hover:shadow-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              Configure First Policy
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-md shadow-blue-500/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/20">
                    <th className="px-6 py-4.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role Identity</th>
                    <th className="px-6 py-4.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Resource</th>
                    <th className="px-6 py-4.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Permitted Action</th>
                    <th className="px-6 py-4.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Condition Clause</th>
                    <th className="px-6 py-4.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {policies.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/30 transition">
                      <td className="px-6 py-4.5">
                        <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-100">
                          <User className="w-3 h-3 text-violet-600" />
                          {p.role}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="text-xs font-bold text-slate-900">{p.resourceName}</span>
                      </td>
                      <td className="px-6 py-4.5">
                        {permissionBadge(p.permission)}
                      </td>
                      <td className="px-6 py-4.5">
                        {p.conditionExpression ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-mono bg-slate-100/80 text-slate-700 border border-slate-200">
                            {p.conditionExpression}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-semibold italic">No condition</span>
                        )}
                      </td>
                      <td className="px-6 py-4.5 text-right">
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 transition px-3 py-2 rounded-xl hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
