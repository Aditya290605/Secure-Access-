"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Policy, Resource } from "@/lib/types";

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
    if (!confirm("Delete this policy?")) return;
    try {
      await apiFetch(`/api/admin/policies/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  const permissionColor: Record<string, string> = {
    READ: "text-green-400 bg-green-500/10 border-green-500/20",
    WRITE: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    DENY: "text-red-400 bg-red-500/10 border-red-500/20",
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition">← Dashboard</Link>
            <h1 className="text-xl font-bold text-white">Policies</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition"
          >
            {showForm ? "Cancel" : "+ New Policy"}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
        )}

        {showForm && (
          <div className="mb-6 bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Create Policy</h2>
            {resources.length === 0 && (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-sm">
                No resources exist yet. <Link href="/dashboard/resources" className="underline">Create a resource first</Link>.
              </div>
            )}
            {formError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{formError}</div>
            )}
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Resource</label>
                <select value={resourceId} onChange={(e) => setResourceId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {resources.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Permission</label>
                <select value={permission} onChange={(e) => setPermission(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {PERMISSIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Condition (optional)</label>
                <input value={conditionExpression} onChange={(e) => setConditionExpression(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. owner_only, business_hours" />
              </div>
              <div className="md:col-span-2">
                <button type="submit" disabled={submitting || resources.length === 0}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white text-sm font-medium rounded-lg transition">
                  {submitting ? "Creating..." : "Create Policy"}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading policies...</div>
        ) : policies.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">🔐</div>
            <p className="text-gray-400">No policies yet. Create one to define access rules.</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Resource</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Permission</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Condition</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {policies.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-500/10 text-purple-400">
                        {p.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">{p.resourceName}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${permissionColor[p.permission] || ""}`}>
                        {p.permission}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{p.conditionExpression || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(p.id)}
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
