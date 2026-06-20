"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield, Database, Lock, Zap, FileText, LogOut,
  ChevronRight, User, Settings, ArrowRight, Activity, Clock
} from "lucide-react";

interface UserInfo {
  email: string;
  roles: string[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("userEmail");
    const rolesJson = localStorage.getItem("userRoles");

    if (!token || !email) {
      router.push("/login");
      return;
    }

    try {
      const roles = rolesJson ? JSON.parse(rolesJson) : ["VIEWER"];
      setUser({ email, roles });
    } catch {
      router.push("/login");
    }
  }, [router]);

  function handleLogout() {
    localStorage.clear();
    router.push("/login");
  }

  if (!user) return null;

  const isAdmin = user.roles.includes("ADMIN");

  const navItems = [
    {
      href: "/dashboard/resources",
      icon: Database,
      title: "Data Resources",
      desc: "Register & classify enterprise data assets",
      color: "text-blue-600 bg-blue-50 border-blue-100",
      border: "hover:border-blue-300 hover:shadow-blue-500/5",
    },
    {
      href: "/dashboard/policies",
      icon: Lock,
      title: "Access Policies",
      desc: "Define role-to-resource permission layers",
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
      border: "hover:border-indigo-300 hover:shadow-indigo-500/5",
    },
    {
      href: "/dashboard/access",
      icon: Zap,
      title: "Interactive Tester",
      desc: "Simulate and verify policy engine traces",
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
      border: "hover:border-emerald-300 hover:shadow-emerald-500/5",
    },
    {
      href: "/dashboard/audit",
      icon: FileText,
      title: "Compliance Auditor",
      desc: "Immutable logs tracking all access events",
      color: "text-purple-600 bg-purple-50 border-purple-100",
      border: "hover:border-purple-300 hover:shadow-purple-500/5",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/25">
                <Shield className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">SecureAccess</span>
            </Link>
            <span className="text-slate-300 text-sm">/</span>
            <span className="text-sm font-bold text-slate-500">Console</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 px-4 py-2 bg-blue-50/50 rounded-xl border border-blue-100/50">
              <User className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-700">{user.email}</span>
              <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded bg-blue-600 text-white shadow-sm shadow-blue-500/10">
                {user.roles[0]}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 transition px-3.5 py-2 rounded-xl hover:bg-rose-50"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {/* Welcome message */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            {isAdmin ? "Governance Control Center" : "Operator Terminal"}
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-semibold">
            {isAdmin
              ? "Register secure assets, construct policy rules, and audit real-time engine logs."
              : "Verify resource permission claims and execute access evaluations."}
          </p>
        </div>

        {/* Status indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm shadow-blue-500/5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Active Identity</div>
            </div>
            <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
            <div className="flex gap-1.5 mt-3">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm shadow-blue-500/5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Console Status</div>
            </div>
            <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Authenticated Session
            </p>
            <p className="text-xs text-slate-400 font-semibold mt-2">JWT keys verified & active</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm shadow-blue-500/5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Clearance Matrix</div>
            </div>
            <p className="text-sm font-bold text-slate-900">
              {isAdmin ? "Full Administration Policy" : user.roles.includes("EDITOR") ? "Read & Write Permissions" : "Read-Only Viewer"}
            </p>
            <p className="text-xs text-slate-400 font-semibold mt-2">Determined by role hierarchies</p>
          </div>
        </div>

        {/* Quick Access panel */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Console Control Grid</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {navItems.map(({ href, icon: Icon, title, desc, color, border }) => (
            <Link
              key={href}
              href={href}
              className={`bg-white rounded-2xl border border-slate-100 p-6 transition-all duration-300 group shadow-sm shadow-blue-500/5 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-200 ${border}`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 border ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{title}</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1.5 leading-relaxed">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
