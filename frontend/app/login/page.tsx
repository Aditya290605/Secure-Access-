"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  roles: string[];
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiFetch<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("userEmail", data.email);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("userRoles", JSON.stringify(data.roles));
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50/30">
      {/* Left panel - Light slate feature column */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-50 border-r border-slate-200/80 flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900">SecureAccess</span>
          </Link>
        </div>

        <div className="max-w-md">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Role-Based Data Access<br />Governance for Enterprises.
          </h2>
          <p className="mt-4 text-sm text-slate-500 leading-relaxed">
            Define declarative access policies, evaluate permissions in real-time, and log every action in an immutable, compliant audit trail.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { title: "Deny-Wins Semantic Engine", desc: "Explicit deny rules override any role permissions instantly." },
              { title: "Immutable Audit Logger", desc: "Compliance-ready logs tracking user context, resource sensitivity, and IP." },
              { title: "Explainable Access Traces", desc: "No more black-box access rules. Every decision gets a step-by-step reasoning log." },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-950">{item.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span>Role-Based Data Access Governance Platform</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-12 lg:px-24">
        <div className="mx-auto w-full max-w-sm">
          {/* Back to Home Link */}
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-950 transition mb-8">
            <ArrowLeft className="w-3 h-3" />
            Back to home
          </Link>

          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-900">SecureAccess</span>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-1.5 text-xs text-slate-500">Sign in to access your administrative dashboard.</p>

          {error && (
            <div className="mt-5 flex items-start gap-2 p-3.5 bg-rose-50 border border-rose-100 rounded-xl">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <p className="text-xs font-medium text-rose-700 leading-normal">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/10 hover:shadow-lg"
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-bold">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
