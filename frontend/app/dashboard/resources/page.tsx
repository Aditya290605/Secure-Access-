"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Resource } from "@/lib/types";

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
    if (!confirm("Delete this resource?")) return;
    try {
      await apiFetch(`/api/admin/resources/${id}`, { method: "DELETE" });
      await loadResources();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  const sensitivityColor: Record<string, string> = {
    PUBLIC: "text-green-400 bg-green-500/10",
    INTERNAL: "text-blue-400 bg-blue-500/10",
    CONFIDENTIAL: "text-yellow-400 bg-yellow-500/10",
    RESTRICTED: "text-red-400 bg-red-500/10",
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition">← Dashboard</Link>
            <h1 className="text-xl font-bold text-white">Resources</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition"
          >
            {showForm ? "Cancel" : "+ New Resource"}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
        )}

        {showForm && (
          <div className="mb-6 bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Create Resource</h2>
            {formError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{formError}</div>
            )}
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. customer_data" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Owner (email)</label>
                <input required type="email" value={owner} onChange={(e) => setOwner(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="owner@company.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Sensitivity Level</label>
                <select value={sensitivityLevel} onChange={(e) => setSensitivityLevel(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {SENSITIVITY_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <input value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description" />
              </div>
              <div className="md:col-span-2">
                <button type="submit" disabled={submitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white text-sm font-medium rounded-lg transition">
                  {submitting ? "Creating..." : "Create Resource"}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading resources...</div>
        ) : resources.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">📦</div>
            <p className="text-gray-400">No resources yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Owner</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Sensitivity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {resources.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3 text-sm text-white font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{r.owner}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${sensitivityColor[r.sensitivityLevel] || "text-gray-400 bg-gray-700"}`}>
                        {r.sensitivityLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">{r.description || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(r.id)}
                        className="text-red-400 hover:text-red-300 text-sm transition">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
