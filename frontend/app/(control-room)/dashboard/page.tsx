"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import { isAuthenticated, clearToken } from "@/lib/auth";
import type { AISystem, Assessment, Finding, DashboardStats } from "@/lib/types";
import { LayoutDashboard, LogOut, ChevronLeft, AlertTriangle } from "lucide-react";

const RISK_COLORS: Record<string, string> = {
  unacceptable: "bg-red-600/20 text-red-400 border border-red-600/30",
  high: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  limited: "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30",
  minimal: "bg-green-500/20 text-green-400 border border-green-500/30",
};

const FRAMEWORK_LABELS: Record<string, string> = {
  eu_ai_act: "EU AI Act",
  dora: "DORA",
  iso_42001: "ISO 42001",
  nist_ai_rmf: "NIST AI RMF",
};

export default function DashboardPage() {
  const router = useRouter();
  const [systems, setSystems] = useState<AISystem[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    Promise.all([
      api.systems.list(),
      api.assessments.list(),
      api.findings.list(),
      api.dashboard.stats(),
    ])
      .then(([s, a, f, d]) => {
        setSystems(s);
        setAssessments(a);
        setFindings(f);
        setStats(d);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Loading…</div>
      </div>
    );
  }

  const openFindings = findings.filter((f) => f.status === "open");
  const criticalCount = openFindings.filter(
    (f) => f.severity === "critical" || f.severity === "high"
  ).length;
  const systemById = Object.fromEntries(systems.map((s) => [s.id, s]));

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50">
      {/* Navbar */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/home" className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Image
              src="/compass-logo-dark.jpg"
              alt="Compass"
              width={28}
              height={28}
              className="w-7 h-7 object-contain mix-blend-screen"
            />
            <span className="font-mono font-semibold text-zinc-50 tracking-tight text-sm">Compass</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-zinc-600">
            <span>/</span>
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="text-sm text-zinc-400">Control Room</span>
          </div>
        </div>
        <button
          onClick={() => { clearToken(); router.push("/login"); }}
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Control Room</h1>
          <p className="text-zinc-500 text-sm mt-1">AI Governance Portfolio</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "AI Systems", value: systems.length },
            { label: "Assessments", value: assessments.length },
            { label: "Open Findings", value: openFindings.length },
            {
              label: "Critical / High",
              value: criticalCount,
              alert: criticalCount > 0,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`bg-zinc-900 border rounded-xl p-5 ${
                stat.alert ? "border-red-600/40" : "border-zinc-800"
              }`}
            >
              <p className="text-xs text-zinc-500 mb-2">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.alert ? "text-red-400" : "text-zinc-50"}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Framework compliance */}
        {stats && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-zinc-50 mb-5">Framework Compliance</h2>
            <div className="space-y-4">
              {Object.entries(stats.framework_compliance).map(([fw, pct]) => (
                <div key={fw}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-zinc-400 font-medium">{FRAMEWORK_LABELS[fw] ?? fw}</span>
                    <span className="text-zinc-600">
                      {pct === null ? "No submitted assessments" : `${Math.round(pct * 100)}%`}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        pct !== null && pct >= 0.8
                          ? "bg-green-500"
                          : pct !== null && pct >= 0.5
                          ? "bg-yellow-400"
                          : pct !== null
                          ? "bg-red-500"
                          : ""
                      }`}
                      style={{ width: pct === null ? "0%" : `${pct * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overdue assessments */}
        {stats && stats.overdue_assessments.length > 0 && (
          <div className="bg-zinc-900 border border-red-600/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-semibold text-red-400">
                Overdue Assessments ({stats.overdue_assessments.length})
              </h2>
            </div>
            <div className="space-y-2">
              {stats.overdue_assessments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 bg-red-950/20 border border-red-900/30 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      {systemById[a.system_id]?.name ?? a.system_id}
                    </p>
                    <p className="text-xs text-zinc-600 font-mono mt-0.5">{a.id}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-red-600/20 text-red-400 border border-red-600/30 px-2 py-0.5 rounded-full">
                      {a.status}
                    </span>
                    <p className="text-xs text-zinc-600 mt-1">Due: {a.due_date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Systems portfolio */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-zinc-50 mb-5">AI Systems Portfolio</h2>
          {systems.length === 0 ? (
            <p className="text-zinc-600 text-sm">No systems registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs text-zinc-600">
                    <th className="text-left pb-3 font-medium">System</th>
                    <th className="text-left pb-3 font-medium">Business Unit</th>
                    <th className="text-left pb-3 font-medium">Risk Tier</th>
                    <th className="text-left pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {systems.map((s) => (
                    <tr key={s.id} className="border-b border-zinc-800/50 last:border-0">
                      <td className="py-3 font-medium text-zinc-200">{s.name}</td>
                      <td className="py-3 text-zinc-500">{s.business_unit ?? "—"}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RISK_COLORS[s.risk_tier]}`}>
                          {s.risk_tier}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="text-xs bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded-full">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top open findings */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-zinc-50 mb-5">Top Open Findings</h2>
          {openFindings.length === 0 ? (
            <p className="text-zinc-600 text-sm">No open findings.</p>
          ) : (
            <div className="space-y-2">
              {openFindings.slice(0, 5).map((f) => (
                <div key={f.id} className="flex items-start gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 mt-0.5 ${
                      f.severity === "critical" || f.severity === "high"
                        ? "bg-red-600/20 text-red-400 border-red-600/30"
                        : "bg-zinc-800 text-zinc-400 border-zinc-700"
                    }`}
                  >
                    {f.severity}
                  </span>
                  <p className="text-sm text-zinc-400">{f.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
