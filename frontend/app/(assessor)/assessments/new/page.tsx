"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import type { AISystem } from "@/lib/types";
import { ChevronLeft, ClipboardList, Plus, X } from "lucide-react";

const FRAMEWORKS = [
  { id: "eu_ai_act",   label: "EU AI Act",   desc: "European Union AI regulation" },
  { id: "dora",        label: "DORA",        desc: "Digital Operational Resilience Act" },
  { id: "iso_42001",   label: "ISO 42001",   desc: "AI management systems standard" },
  { id: "nist_ai_rmf", label: "NIST AI RMF", desc: "NIST AI Risk Management Framework" },
];

const RISK_TIERS = [
  { id: "unacceptable", label: "Unacceptable", color: "text-red-400 border-red-600/40 bg-red-600/10" },
  { id: "high",         label: "High",         color: "text-orange-400 border-orange-500/40 bg-orange-500/10" },
  { id: "limited",      label: "Limited",      color: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10" },
  { id: "minimal",      label: "Minimal",      color: "text-green-400 border-green-600/40 bg-green-600/10" },
];

export default function NewAssessmentPage() {
  const router = useRouter();

  /* assessment form */
  const [systems,    setSystems]    = useState<AISystem[]>([]);
  const [systemId,   setSystemId]   = useState("");
  const [frameworks, setFrameworks] = useState<string[]>([]);
  const [dueDate,    setDueDate]    = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  /* add-system panel */
  const [showAddSystem,  setShowAddSystem]  = useState(false);
  const [sysName,        setSysName]        = useState("");
  const [sysDesc,        setSysDesc]        = useState("");
  const [sysRisk,        setSysRisk]        = useState("limited");
  const [sysBU,          setSysBU]          = useState("");
  const [sysLoading,     setSysLoading]     = useState(false);
  const [sysError,       setSysError]       = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    api.systems.list().then(s => {
      setSystems(s);
      if (s.length === 0) setShowAddSystem(true); // auto-open when empty
    }).catch(() => router.push("/login"));
  }, [router]);

  function toggleFramework(id: string) {
    setFrameworks(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  }

  async function handleCreateSystem(e: React.FormEvent) {
    e.preventDefault();
    if (!sysName.trim()) { setSysError("System name is required."); return; }
    setSysLoading(true);
    setSysError(null);
    try {
      const created = await api.systems.create({
        name: sysName.trim(),
        description: sysDesc.trim() || null,
        risk_tier: sysRisk,
        business_unit: sysBU.trim() || null,
        status: "active",
      });
      setSystems(prev => [created, ...prev]);
      setSystemId(created.id);
      setShowAddSystem(false);
      setSysName(""); setSysDesc(""); setSysBU(""); setSysRisk("limited");
    } catch (err: unknown) {
      setSysError(err instanceof Error ? err.message : "Failed to create system");
    } finally {
      setSysLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!systemId || frameworks.length === 0) {
      setError("Select a system and at least one framework.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const a = await api.assessments.create({
        system_id: systemId,
        frameworks,
        due_date: dueDate || undefined,
      });
      router.push(`/assessments/${a.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create assessment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50">

      {/* nav */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4 sticky top-0 bg-[#09090b]/95 backdrop-blur z-10">
        <Link href="/assessments" className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2">
          <Image src="/compass-logo-dark.jpg" alt="Compass" width={28} height={28}
            className="w-7 h-7 object-contain mix-blend-screen" />
          <span className="font-mono font-semibold text-zinc-50 tracking-tight text-sm">Compass</span>
        </div>
        <span className="text-zinc-700">/</span>
        <div className="flex items-center gap-1.5">
          <ClipboardList className="w-3.5 h-3.5 text-zinc-400" />
          <Link href="/assessments" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            Assessments
          </Link>
        </div>
        <span className="text-zinc-700">/</span>
        <span className="text-sm text-zinc-400">New</span>
      </header>

      <main className="max-w-xl mx-auto px-6 py-10 space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-zinc-50">New Assessment</h1>
          <p className="text-zinc-500 text-sm mt-1">Select a system and frameworks to start collecting evidence</p>
        </div>

        {/* ── Register a system panel ── */}
        {showAddSystem && (
          <div className="bg-zinc-900 border border-blue-600/30 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <p className="text-sm font-semibold text-zinc-100">Register an AI System</p>
              {systems.length > 0 && (
                <button onClick={() => setShowAddSystem(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <form onSubmit={handleCreateSystem} className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">System name <span className="text-red-400">*</span></label>
                <input
                  value={sysName}
                  onChange={e => setSysName(e.target.value)}
                  placeholder="e.g. Credit Scoring Model"
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Description <span className="text-zinc-600">(optional)</span></label>
                <input
                  value={sysDesc}
                  onChange={e => setSysDesc(e.target.value)}
                  placeholder="What does this system do?"
                  className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Business unit <span className="text-zinc-600">(optional)</span></label>
                  <input
                    value={sysBU}
                    onChange={e => setSysBU(e.target.value)}
                    placeholder="e.g. Risk & Finance"
                    className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Risk tier <span className="text-red-400">*</span></label>
                  <select
                    value={sysRisk}
                    onChange={e => setSysRisk(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  >
                    {RISK_TIERS.map(r => (
                      <option key={r.id} value={r.id} className="bg-zinc-900">{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              {sysError && (
                <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">{sysError}</p>
              )}
              <button type="submit" disabled={sysLoading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                <Plus className="w-4 h-4" />
                {sysLoading ? "Registering…" : "Register System"}
              </button>
            </form>
          </div>
        )}

        {/* ── Assessment form ── */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* System selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">AI System</label>
              {!showAddSystem && (
                <button type="button" onClick={() => setShowAddSystem(true)}
                  className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  <Plus className="w-3 h-3" /> Add new system
                </button>
              )}
            </div>
            <select
              value={systemId}
              onChange={e => setSystemId(e.target.value)}
              required
              disabled={systems.length === 0}
              className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none disabled:opacity-40"
            >
              <option value="" className="bg-zinc-900 text-zinc-500">
                {systems.length === 0 ? "Register a system above first…" : "Select a system…"}
              </option>
              {systems.map(s => (
                <option key={s.id} value={s.id} className="bg-zinc-900">
                  {s.name}{s.risk_tier ? ` · ${s.risk_tier}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Frameworks */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Frameworks</label>
            <p className="text-xs text-zinc-600">Select all frameworks that apply to this assessment</p>
            <div className="grid grid-cols-2 gap-2">
              {FRAMEWORKS.map(fw => {
                const selected = frameworks.includes(fw.id);
                return (
                  <button key={fw.id} type="button" onClick={() => toggleFramework(fw.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selected
                        ? "bg-blue-600/15 border-blue-500/60 text-blue-300"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
                    }`}>
                    <p className="font-medium text-sm">{fw.label}</p>
                    <p className="text-xs mt-0.5 opacity-70">{fw.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">
              Due Date <span className="text-zinc-600 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 [color-scheme:dark]"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading || systems.length === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium text-sm transition-colors">
              {loading ? "Creating…" : "Create Assessment"}
            </button>
            <Link href="/assessments"
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
