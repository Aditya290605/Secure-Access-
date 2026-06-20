"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Resource } from "@/lib/types";
import { 
  Database, Plus, Trash2, ArrowLeft, Shield, 
  Globe, Building, Lock, AlertTriangle, HelpCircle
} from "lucide-react";

const SENSITIVITY_LEVELS = ["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"];

export default function ResourcesPage() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("");
  const [sensitivityLevel, setSensitivityLevel] = useState("INTERNAL");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    loadResources();
  }, [router]);

  async function loadResources() {
    try {
      setLoading(true);
      const data = await apiFetch<Resource[]>("/api/admin/resources");
      setResources(data);
      setError("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load resources");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await apiFetch("/api/admin/resources", {
        method: "POST",
        body: { name, description, owner, sensitivityLevel },
      });
      setName(""); setDescription(""); setOwner(""); setSensitivityLevel("INTERNAL");
      setShowForm(false);
      await loadResources();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create resource");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this resource? All associated policies will also be deleted.")) return;
    try {
      await apiFetch(`/api/admin/resources/${id}`, { method: "DELETE" });
      await loadResources();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  const sensitivityBadge = (level: string) => {
    switch (level) {
      case "PUBLIC":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <Globe className="w-3 h-3" />
            PUBLIC
          </span>
        );
      case "INTERNAL":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
            <Building className="w-3 h-3" />
            INTERNAL
          </span>
        );
      case "CONFIDENTIAL":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
            <Lock className="w-3 h-3" />
            CONFIDENTIAL
          </span>
        );
      case "RESTRICTED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
            <AlertTriangle className="w-3 h-3" />
            RESTRICTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-slate-50 text-slate-700 border border-slate-100">
            <HelpCircle className="w-3 h-3" />
            {level}
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
              <Database className="w-4 h-4 text-blue-600" />
              Resources Catalog
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
                Register Resource
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

        {/* Create resource card */}
        {showForm && (
          <div className="mb-8 bg-white border border-slate-100 shadow-md shadow-blue-500/5 rounded-2xl p-6 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Database className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <h2 className="text-sm font-bold text-slate-950">Register New Data Resource</h2>
            </div>

            {formError && (
              <div className="mb-4 flex items-start gap-2 p-3.5 bg-rose-50 border border-rose-100 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                <p className="text-xs font-bold text-rose-700">{formError}</p>
              </div>
            )}

            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Resource Name</label>
                <input 
                  required 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  placeholder="e.g. customer_database" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Owner Email</label>
                <input 
                  required 
                  type="email" 
                  value={owner} 
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  placeholder="owner@company.com" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Sensitivity Level</label>
                <select 
                  value={sensitivityLevel} 
                  onChange={(e) => setSensitivityLevel(e.target.value)}
                  className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                >
                  {SENSITIVITY_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Description</label>
                <input 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  placeholder="Optional description of the resource context" 
                />
              </div>

              <div className="md:col-span-2 pt-2">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/10 hover:shadow-lg"
                >
                  {submitting ? "Registering..." : "Register Resource"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Resources list container */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2 bg-white border border-slate-100 rounded-2xl shadow-sm shadow-blue-500/5">
            <span className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <span className="text-xs font-bold">Loading data assets...</span>
          </div>
        ) : resources.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm shadow-blue-500/5 animate-fade-in">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100/50">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">No Data Resources Registered</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 leading-normal font-semibold">Get started by registering a resource asset. You can then map access permissions and monitor auditor evaluations.</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/10 hover:shadow-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              Register First Resource
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-md shadow-blue-500/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/20">
                    <th className="px-6 py-4.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resource Name</th>
                    <th className="px-6 py-4.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Owner Email</th>
                    <th className="px-6 py-4.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sensitivity Class</th>
                    <th className="px-6 py-4.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resources.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/30 transition">
                      <td className="px-6 py-4.5">
                        <span className="text-xs font-bold text-slate-900">{r.name}</span>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="text-xs font-semibold text-slate-500">{r.owner}</span>
                      </td>
                      <td className="px-6 py-4.5">
                        {sensitivityBadge(r.sensitivityLevel)}
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="text-xs text-slate-500 font-semibold block max-w-sm truncate" title={r.description}>
                          {r.description || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-right">
                        <button 
                          onClick={() => handleDelete(r.id)}
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
