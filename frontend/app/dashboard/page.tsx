"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserInfo {
  userId: string;
  email: string;
  roles: string[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userJson = localStorage.getItem("user");

    if (!token || !userJson) {
      router.push("/login");
      return;
    }

    try {
      setUser(JSON.parse(userJson));
    } catch {
      router.push("/login");
    }
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white tracking-tight">
            SecureAccess
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{user.email}</span>
            <div className="flex gap-1.5">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20"
                >
                  {role}
                </span>
              ))}
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-gray-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Welcome card */}
          <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-2">
              Welcome back
            </h2>
            <p className="text-gray-400 text-sm">
              You are logged in as <span className="text-white font-medium">{user.email}</span> with{" "}
              <span className="text-blue-400 font-medium">{user.roles.join(", ")}</span> role(s).
              {user.roles.includes("ADMIN") ? " Manage resources, policies, and test access below." : " Contact an admin for access policy changes."}
            </p>
          </div>

          {/* Quick info card */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">
              Your Profile
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">User ID</p>
                <p className="text-sm text-white font-mono truncate">{user.userId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-white">{user.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Roles</p>
                <div className="flex gap-1.5 mt-1">
                  {user.roles.map((role) => (
                    <span
                      key={role}
                      className="px-2 py-0.5 text-xs font-medium rounded bg-green-500/10 text-green-400"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/dashboard/resources"
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center hover:border-blue-500/40 hover:bg-gray-900/80 transition group">
            <div className="text-3xl mb-2">📦</div>
            <h3 className="text-sm font-medium text-white group-hover:text-blue-400 transition">Resources</h3>
            <p className="text-xs text-gray-500 mt-1">Manage governed data assets</p>
          </Link>
          <Link href="/dashboard/policies"
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center hover:border-purple-500/40 hover:bg-gray-900/80 transition group">
            <div className="text-3xl mb-2">🔐</div>
            <h3 className="text-sm font-medium text-white group-hover:text-purple-400 transition">Policies</h3>
            <p className="text-xs text-gray-500 mt-1">Define access control rules</p>
          </Link>
          <Link href="/dashboard/access"
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center hover:border-green-500/40 hover:bg-gray-900/80 transition group">
            <div className="text-3xl mb-2">🧪</div>
            <h3 className="text-sm font-medium text-white group-hover:text-green-400 transition">Try Access</h3>
            <p className="text-xs text-gray-500 mt-1">Test policy decisions</p>
          </Link>
          <div className="bg-gray-900/50 border border-gray-800 border-dashed rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">📋</div>
            <h3 className="text-sm font-medium text-gray-300">Audit Log</h3>
            <p className="text-xs text-gray-500 mt-1">Coming in Phase 3</p>
          </div>
        </div>
      </main>
    </div>
  );
}
