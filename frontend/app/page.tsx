"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Shield, Lock, FileText, Users, ChevronRight, Activity,
  Eye, Database, ArrowRight, CheckCircle2, XCircle, BarChart3, Zap,
  Play, RefreshCw, Server, AlertTriangle, ArrowLeft, Info, HelpCircle
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Resource, UserInfo, AccessDecision } from "@/lib/types";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Real database state
  const [realResources, setRealResources] = useState<Resource[]>([]);
  const [realUsers, setRealUsers] = useState<UserInfo[]>([]);
  const [loadingRealData, setLoadingRealData] = useState(false);

  // Sandbox inputs
  const [selectedUserEmail, setSelectedUserEmail] = useState("VIEWER_USER");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [selectedAction, setSelectedAction] = useState<"READ" | "WRITE">("READ");
  const [selectedMockResource, setSelectedMockResource] = useState<"PUBLIC" | "CONFIDENTIAL" | "RESTRICTED">("PUBLIC");

  // Output
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<{
    allowed: boolean;
    reason: string;
    isRealDecision?: boolean;
    decisionName?: string;
  } | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      loadRealDatabaseData();
    } else {
      runMockEvaluation("VIEWER_USER", "PUBLIC", "READ");
    }

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function loadRealDatabaseData() {
    try {
      setLoadingRealData(true);
      const [resourcesData, usersData] = await Promise.all([
        apiFetch<Resource[]>("/api/admin/resources"),
        apiFetch<UserInfo[]>("/api/admin/users"),
      ]);
      setRealResources(resourcesData);
      setRealUsers(usersData);

      if (usersData.length > 0) {
        setSelectedUserId(usersData[0].id);
        setSelectedUserEmail(usersData[0].email);
      }
      if (resourcesData.length > 0) {
        setSelectedResourceId(resourcesData[0].id);
      }

      // Run initial real check if elements exist
      if (usersData.length > 0 && resourcesData.length > 0) {
        runRealEvaluation(usersData[0].id, resourcesData[0].id, "READ");
      } else {
        // Fallback mock check if database is empty
        runMockEvaluation("VIEWER_USER", "PUBLIC", "READ");
      }
    } catch {
      // Fallback on error
      runMockEvaluation("VIEWER_USER", "PUBLIC", "READ");
    } finally {
      setLoadingRealData(false);
    }
  }

  // Real Backend policy check call
  async function runRealEvaluation(uId: string, rId: string, act: "READ" | "WRITE") {
    setEvaluating(true);
    setEvalResult(null);
    try {
      const result = await apiFetch<AccessDecision>(
        `/api/access/admin/check?userId=${uId}`,
        {
          method: "POST",
          body: { resourceId: rId, action: act },
        }
      );
      setEvalResult({
        allowed: result.allowed,
        reason: result.reason,
        isRealDecision: true,
        decisionName: result.decision
      });
    } catch (err: unknown) {
      setEvalResult({
        allowed: false,
        reason: err instanceof Error ? err.message : "Access evaluation check failed."
      });
    } finally {
      setEvaluating(false);
    }
  }

  // Simulated policy check call
  function runMockEvaluation(role: string, resourceType: "PUBLIC" | "CONFIDENTIAL" | "RESTRICTED", action: "READ" | "WRITE") {
    setEvaluating(true);
    setEvalResult(null);
    
    setTimeout(() => {
      let allowed = false;
      let reason = "";

      if (resourceType === "PUBLIC") {
        allowed = true;
        reason = "Access allowed: Public sensitivity level requires no special permissions.";
      } else if (resourceType === "CONFIDENTIAL") {
        if (role === "ADMIN" || role === "EDITOR" || role === "ADMIN_USER" || role === "EDITOR_USER") {
          allowed = true;
          reason = `Access allowed: User possesses role authority matches sensitivity class CONFIDENTIAL.`;
        } else {
          allowed = false;
          reason = "Access denied: Role VIEWER lacks read/write clearance for Confidential resources.";
        }
      } else { // RESTRICTED
        if (role === "ADMIN" || role === "ADMIN_USER") {
          if (action === "WRITE") {
            allowed = true;
            reason = "Access allowed: Admin WRITE permission explicitly matches RESTRICTED key sensitivity.";
          } else {
            allowed = true;
            reason = "Access allowed: WRITE implies READ capability inheritance for Administrators.";
          }
        } else {
          allowed = false;
          reason = `Access denied: Role ${role.replace("_USER", "")} lacks sufficient clearance parameters for Restricted keys.`;
        }
      }

      setEvalResult({
        allowed,
        reason,
        isRealDecision: false,
        decisionName: allowed ? "ALLOWED" : "DENIED"
      });
      setEvaluating(false);
    }, 600);
  }

  const handleRealCheck = (uId: string, rId: string, act: "READ" | "WRITE") => {
    if (!uId || !rId) return;
    runRealEvaluation(uId, rId, act);
  };

  const handleMockCheck = (role: string, resType: "PUBLIC" | "CONFIDENTIAL" | "RESTRICTED", act: "READ" | "WRITE") => {
    runMockEvaluation(role, resType, act);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white border-b border-blue-100 shadow-sm shadow-blue-500/5" : "bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/25">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">SecureAccess</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Features</a>
              <a href="#sandbox" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Interactive Sandbox</a>
              <a href="#architecture" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Architecture</a>
            </div>
            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                <Link href="/dashboard"
                  className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/10 hover:shadow-lg">
                  Console Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login"
                    className="text-sm font-bold text-slate-700 hover:text-blue-600 transition px-4 py-2">
                    Sign In
                  </Link>
                  <Link href="/register"
                    className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/10 hover:shadow-lg">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-24 px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-blue-50/20 via-white to-white">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70" />
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-7 flex flex-col justify-center animate-fade-in-up">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 border border-blue-100 rounded-full text-xs font-bold text-blue-700 mb-6 w-fit shadow-sm shadow-blue-500/5">
              <Zap className="w-3.5 h-3.5" />
              Unified Access Management Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.08] tracking-tight">
              Govern data access.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">Enforce policies.</span><br />
              Audit in real time.
            </h1>
            <p className="mt-6 text-sm sm:text-base md:text-lg text-slate-500 leading-relaxed max-w-xl font-medium">
              An enterprise-grade role-based access engine. Build policies with deny-wins semantics, evaluate checks in &lt; 5ms with full explanation, and track everything in an immutable log.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {isLoggedIn ? (
                <Link href="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-500/20 hover:shadow-xl">
                  Go to console dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link href="/register"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-500/20 hover:shadow-xl">
                  Start Governing Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <a href="#sandbox"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition border border-slate-200 shadow-sm shadow-blue-500/5 hover:border-slate-300">
                Try Live Sandbox
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Micro stats */}
            <div className="mt-12 pt-8 border-t border-slate-200/80 grid grid-cols-3 gap-6 max-w-lg">
              <div>
                <div className="text-2xl font-black text-slate-900">&lt; 5ms</div>
                <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Policy Evaluation</div>
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">100%</div>
                <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Audit Coverage</div>
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">Deny-Wins</div>
                <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Semantics</div>
              </div>
            </div>
          </div>

          {/* Interactive Live Sandbox (Motion Object) */}
          <div className="lg:col-span-5 animate-fade-in stagger-1" id="sandbox">
            <div className="bg-white rounded-3xl border border-blue-100 shadow-xl shadow-blue-500/5 overflow-hidden">
              <div className="px-6 py-4 border-b border-blue-50 bg-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-200" />
                  <div className="w-3 h-3 rounded-full bg-slate-200" />
                  <div className="w-3 h-3 rounded-full bg-slate-200" />
                </div>
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  {isLoggedIn ? "LIVE DATABASE WORKSPACE" : "LIVE SIMULATOR ENVIRONMENT"}
                </div>
              </div>

              <div className="p-6 space-y-5">
                {isLoggedIn && realUsers.length > 0 && realResources.length > 0 ? (
                  // LOGGED IN DYNAMIC INPUTS
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">1. Select Database User Context</label>
                      <select
                        value={selectedUserId}
                        onChange={(e) => {
                          const uId = e.target.value;
                          setSelectedUserId(uId);
                          const userObj = realUsers.find(u => u.id === uId);
                          if (userObj) setSelectedUserEmail(userObj.email);
                          handleRealCheck(uId, selectedResourceId, selectedAction);
                        }}
                        className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                      >
                        {realUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.email} [{u.roles.join(", ")}]
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">2. Choose Proposed Action</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(["READ", "WRITE"] as const).map((a) => (
                          <button
                            key={a}
                            onClick={() => {
                              setSelectedAction(a);
                              handleRealCheck(selectedUserId, selectedResourceId, a);
                            }}
                            className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition ${
                              selectedAction === a
                                ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm"
                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">3. Target Database Resource</label>
                      <select
                        value={selectedResourceId}
                        onChange={(e) => {
                          const rId = e.target.value;
                          setSelectedResourceId(rId);
                          handleRealCheck(selectedUserId, rId, selectedAction);
                        }}
                        className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                      >
                        {realResources.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} [Sensitivity: {r.sensitivityLevel}]
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  // ANONYMOUS MOCK SIMULATOR INPUTS
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">1. Select Subject Role</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["ADMIN", "EDITOR", "VIEWER"] as const).map((r) => (
                          <button
                            key={r}
                            onClick={() => {
                              setSelectedUserEmail(`${r}_USER`);
                              handleMockCheck(`${r}_USER`, selectedMockResource, selectedAction);
                            }}
                            className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition ${
                              selectedUserEmail === `${r}_USER`
                                ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm"
                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">2. Select Action</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(["READ", "WRITE"] as const).map((a) => (
                          <button
                            key={a}
                            onClick={() => {
                              setSelectedAction(a);
                              handleMockCheck(selectedUserEmail, selectedMockResource, a);
                            }}
                            className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition ${
                              selectedAction === a
                                ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm"
                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">3. Target Resource Sensitivity</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["PUBLIC", "CONFIDENTIAL", "RESTRICTED"] as const).map((res) => (
                          <button
                            key={res}
                            onClick={() => {
                              setSelectedMockResource(res);
                              handleMockCheck(selectedUserEmail, res, selectedAction);
                            }}
                            className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition ${
                              selectedMockResource === res
                                ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm"
                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            {res}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Animated Evaluation Visual - Changed from dark grey theme to high contrast white/blue layout */}
                <div className="relative bg-blue-50/30 rounded-2xl p-5 border border-blue-100/80 font-mono text-xs text-slate-700 min-h-[150px] flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-blue-100/60 pb-2 mb-2 text-[10px] font-bold text-blue-500">
                    <span>EVALUATION ENGINE OUTPUT</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100/50">ACTIVE</span>
                  </div>

                  {evaluating ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                      <span className="text-xs font-bold text-slate-500 animate-pulse">Running authorization check...</span>
                    </div>
                  ) : evalResult ? (
                    <div className="space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-blue-500 font-bold">&gt;</span>
                          <span className="text-indigo-600 font-bold">request:</span>
                          <span className="text-slate-900 font-bold block truncate max-w-[280px]">
                            {selectedUserEmail.replace("_USER", "")} → {selectedAction} → {isLoggedIn && realResources.length > 0 ? "live_asset" : selectedMockResource}
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="text-blue-500 font-bold">&gt;</span>
                          <span className="text-slate-400 font-bold">explain:</span>
                          <span className="text-slate-600 leading-normal font-semibold">{evalResult.reason}</span>
                        </div>
                      </div>

                      <div className={`mt-3 flex items-center justify-between p-3 rounded-xl border ${
                        evalResult.allowed
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-rose-50 border-rose-200 text-rose-800"
                      }`}>
                        <div className="flex items-center gap-2 font-bold text-xs">
                          {evalResult.allowed ? (
                            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-4.5 h-4.5 text-rose-600" />
                          )}
                          <span className="tracking-tight">DECISION: {evalResult.decisionName}</span>
                        </div>
                        <span className="text-[9px] uppercase font-bold tracking-wider opacity-60">
                          {evalResult.isRealDecision ? "db dynamic" : "simulation"}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 lg:px-8 border-y border-blue-50 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-16">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Enterprise Core Features</h2>
            <p className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
              Fully governed role-based resource access
            </p>
            <p className="mt-4 text-sm sm:text-base text-slate-500 leading-relaxed font-semibold">
              Fine-grained permissions engineered to keep your sensitive resource pipelines fully audit-compliant and protected from unauthorized leaks.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "Deny-Wins Semantic Engine",
                desc: "A default-deny policy model ensuring that explicit deny rules always override allow permissions, eliminating critical policy overlaps.",
                color: "text-blue-600 bg-blue-50 border-blue-100/60 shadow-sm shadow-blue-500/5",
              },
              {
                icon: Eye,
                title: "Explainable Authorization",
                desc: "Provide transparency for auditor operations. Every single access decision includes a generated trace explaining the logic outcome.",
                color: "text-indigo-600 bg-indigo-50 border-indigo-100/60 shadow-sm shadow-indigo-500/5",
              },
              {
                icon: FileText,
                title: "Immutable Auditing logs",
                desc: "Track every attempt. Logs store actor ID, requested resource sensitivity, evaluation action, evaluation timestamp, and client IP.",
                color: "text-purple-600 bg-purple-50 border-purple-100/60 shadow-sm shadow-purple-500/5",
              },
              {
                icon: Users,
                title: "Permission Inheritance",
                desc: "Hierarchical capability system where administrative roles inherit lesser permissions. For example, WRITE permission automatically implies READ.",
                color: "text-violet-600 bg-violet-50 border-violet-100/60 shadow-sm shadow-violet-500/5",
              },
              {
                icon: Database,
                title: "Classification Cataloging",
                desc: "Organize assets using standardized tags: Public, Internal, Confidential, and Restricted. Keep data isolated by security level.",
                color: "text-sky-600 bg-sky-50 border-sky-100/60 shadow-sm shadow-sky-500/5",
              },
              {
                icon: BarChart3,
                title: "Governance Intelligence",
                desc: "Real-time visual monitoring displaying live access statistics, permit/deny ratio curves, and filterable system query trails.",
                color: "text-emerald-600 bg-emerald-50 border-emerald-100/60 shadow-sm shadow-emerald-500/5",
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-lg hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border mb-5 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">{title}</h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Detail */}
      <section id="architecture" className="py-24 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Enterprise Stack</h2>
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              Production-grade architecture
            </p>
            <p className="mt-3 text-sm text-slate-500 font-semibold">
              Modern REST services working hand-in-hand with standard React frontend state.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <Server className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Backend Governance Services</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Spring Boot 3.4 API Engine</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { title: "Stateless Security Model", desc: "JWT signature validation with custom claim extraction filters." },
                  { title: "Deny-Wins Resolver Pipeline", desc: "Pre-evaluates permissions using hierarchical role matrix matching." },
                  { title: "Async @EventListener Pipeline", desc: "Asynchronously logs access checks in PostgreSQL database." },
                  { title: "Spring Actuator Integrations", desc: "Exposes health check metrics, heap stats, and DB connection diagnostics." },
                ].map(({ title, desc }) => (
                  <div key={title} className="flex gap-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{title}</h4>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Client Governance Panel</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Next.js 15 Client Engine</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { title: "Interactive Policy Testing", desc: "Allows simulation testing of subject-action pairs against cataloged assets." },
                  { title: "Granular Policy Builder", desc: "Role-to-resource permission mapper support conditions validation expressions." },
                  { title: "Paginated Compliance Auditor", desc: "Auditors can page, search and filter logs based on evaluation decisions." },
                  { title: "Local State Synced Session", desc: "Ensures tokens and account contexts persist cleanly across browser loads." },
                ].map(({ title, desc }) => (
                  <div key={title} className="flex gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{title}</h4>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">SecureAccess</span>
          </div>
          <div className="flex gap-6 text-xs font-bold text-slate-500">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#sandbox" className="hover:text-blue-600 transition-colors">Sandbox</a>
            <a href="#architecture" className="hover:text-blue-600 transition-colors">Architecture</a>
            <Link href="/login" className="hover:text-blue-600 transition-colors">Sign In</Link>
          </div>
          <p className="text-xs font-bold text-slate-400">© 2026 SecureAccess. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
