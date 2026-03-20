"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import { isAuthenticated, clearToken } from "@/lib/auth";
import type { AISystem, Assessment, Finding, DashboardStats } from "@/lib/types";
import {
  LayoutDashboard, LogOut, ChevronLeft, AlertTriangle,
  TrendingUp, Shield, Activity, CheckCircle, Clock,
  XCircle, BarChart3, Layers, Calendar, Download, FileText, Code2, Table,
} from "lucide-react";
import { generateMarkdown, generateHTML, generateExcel, downloadFile } from "@/lib/export-report";

/* ── colour maps ──────────────────────────────────── */
const RISK_PILL: Record<string, string> = {
  unacceptable: "bg-red-600/20 text-red-400 border border-red-600/30",
  high:         "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  limited:      "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30",
  minimal:      "bg-green-500/20 text-green-400 border border-green-500/30",
};
const RISK_HEX: Record<string, string> = {
  unacceptable: "#ef4444", high: "#f97316", limited: "#facc15", minimal: "#22c55e",
};
const SEV_COLOR: Record<string, string> = {
  critical: "bg-red-500", high: "bg-orange-500", medium: "bg-yellow-400", low: "bg-zinc-500",
};
const FW_LABELS: Record<string, string> = {
  eu_ai_act: "EU AI Act", dora: "DORA", iso_42001: "ISO 42001", nist_ai_rmf: "NIST AI RMF",
};

/* ── SVG donut ────────────────────────────────────── */
function DonutChart({ data, center }: {
  data: { label: string; value: number; color: string }[];
  center?: { value: string | number; sub: string };
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 52; const circ = 2 * Math.PI * r;
  let offset = 0;
  const segs = data.map(d => {
    const dash = total ? (d.value / total) * circ : 0;
    const s = { ...d, dash, offset };
    offset += dash;
    return s;
  });
  return (
    <div className="relative">
      <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
        {total === 0
          ? <circle cx="64" cy="64" r={r} fill="none" stroke="#27272a" strokeWidth="16" />
          : segs.map(s => (
            <circle key={s.label} cx="64" cy="64" r={r} fill="none"
              stroke={s.color} strokeWidth="16"
              strokeDasharray={`${s.dash} ${circ - s.dash}`}
              strokeDashoffset={-s.offset} />
          ))}
        <circle cx="64" cy="64" r="38" fill="#09090b" />
      </svg>
      {center && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-zinc-50">{center.value}</span>
          <span className="text-xs text-zinc-500">{center.sub}</span>
        </div>
      )}
    </div>
  );
}

/* ── Radial gauge ─────────────────────────────────── */
function RadialGauge({ pct, color = "#3b82f6", size = 64 }: { pct: number | null; color?: string; size?: number }) {
  const r = 26; const circ = 2 * Math.PI * r;
  const fill = pct === null ? 0 : Math.min(pct, 1) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="-rotate-90">
      <circle cx="32" cy="32" r={r} fill="none" stroke="#27272a" strokeWidth="7" />
      <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round" />
    </svg>
  );
}

/* ── Health score ring ────────────────────────────── */
function HealthRing({ score }: { score: number }) {
  const r = 42; const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#facc15" : "#ef4444";
  const label = score >= 75 ? "Healthy" : score >= 50 ? "Needs Attention" : "At Risk";
  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#27272a" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-zinc-500 mt-0.5">{label}</span>
      </div>
    </div>
  );
}

/* ── Stat badge ───────────────────────────────────── */
function StatBadge({ icon: Icon, label, value, color, bg, border }: {
  icon: React.ElementType; label: string; value: string | number;
  color: string; bg: string; border: string;
}) {
  return (
    <div className={`bg-zinc-900 border ${border} rounded-xl p-5`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-500">{label}</span>
        <div className={`w-7 h-7 rounded-md ${bg} flex items-center justify-center`}>
          <Icon className={`w-3.5 h-3.5 ${color}`} />
        </div>
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
export default function DashboardPage() {
  const router = useRouter();
  const [systems,     setSystems]     = useState<AISystem[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [findings,    setFindings]    = useState<Finding[]>([]);
  const [stats,       setStats]       = useState<DashboardStats | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [exportOpen,  setExportOpen]  = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    Promise.all([api.systems.list(), api.assessments.list(), api.findings.list(), api.dashboard.stats()])
      .then(([s, a, f, d]) => { setSystems(s); setAssessments(a); setFindings(f); setStats(d); })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="text-zinc-500 text-sm animate-pulse">Loading dashboard…</div>
    </div>
  );

  /* ── export handlers ────────────────────────────── */
  function handleExport(format: "html" | "md") {
    if (!stats) return;
    const data = { systems, assessments, findings, stats, generatedAt: new Date() };
    const ts = new Date().toISOString().slice(0, 10);
    if (format === "md") {
      downloadFile(generateMarkdown(data), `compass-report-${ts}.md`, "text/markdown");
    } else {
      downloadFile(generateHTML(data), `compass-report-${ts}.html`, "text/html");
    }
    setExportOpen(false);
  }

  async function handleExportExcel() {
    if (!stats) return;
    const data = { systems, assessments, findings, stats, generatedAt: new Date() };
    await generateExcel(data);
    setExportOpen(false);
  }

  /* ── derived values ─────────────────────────────── */
  const activeSystems   = systems.filter(s => s.status === "active");
  const openFindings    = findings.filter(f => f.status === "open");
  const resolvedFindings = findings.filter(f => f.status === "resolved");
  const criticalCount   = openFindings.filter(f => f.severity === "critical" || f.severity === "high").length;
  const systemById      = Object.fromEntries(systems.map(s => [s.id, s]));

  // systems with assessments
  const assessedSystemIds = new Set(assessments.map(a => a.system_id));
  const coverageRate = activeSystems.length
    ? Math.round((activeSystems.filter(s => assessedSystemIds.has(s.id)).length / activeSystems.length) * 100)
    : 0;

  // finding resolution rate
  const totalFindings = findings.length;
  const resolutionRate = totalFindings ? Math.round((resolvedFindings.length / totalFindings) * 100) : 0;

  // compliance avg
  const complianceEntries = Object.entries(stats?.framework_compliance ?? {});
  const filledEntries = complianceEntries.filter(([, v]) => v !== null);
  const avgCompliance = filledEntries.length
    ? filledEntries.reduce((s, [, v]) => s + (v as number), 0) / filledEntries.length
    : null;

  // health score (0-100)
  const healthScore = (() => {
    if (systems.length === 0) return 0;
    let score = avgCompliance !== null ? avgCompliance * 100 : 50;
    const highRiskRatio = systems.filter(s => s.risk_tier === "unacceptable" || s.risk_tier === "high").length / systems.length;
    score -= highRiskRatio * 20;
    score -= (criticalCount * 3);
    const overdue = stats?.overdue_assessments.length ?? 0;
    score -= overdue * 5;
    return Math.max(0, Math.min(100, Math.round(score)));
  })();

  // risk distribution
  const riskCounts = (["unacceptable","high","limited","minimal"] as const).map(t => ({
    label: t, value: systems.filter(s => s.risk_tier === t).length, color: RISK_HEX[t],
  }));

  // systems at risk
  const systemsAtRisk = systems.filter(s => s.risk_tier === "unacceptable" || s.risk_tier === "high");

  // severity breakdown
  const sevCounts = (["critical","high","medium","low"] as const).map(sev => ({
    label: sev, value: openFindings.filter(f => f.severity === sev).length,
  }));
  const maxSev = Math.max(...sevCounts.map(s => s.value), 1);

  // assessment status
  const asmStatus = [
    { label: "Draft",       value: assessments.filter(a => a.status === "draft").length,     color: "bg-zinc-600",   hex: "#52525b" },
    { label: "In Review",   value: assessments.filter(a => a.status === "in_review").length, color: "bg-blue-500",   hex: "#3b82f6" },
    { label: "Complete",    value: assessments.filter(a => a.status === "complete").length,   color: "bg-green-500",  hex: "#22c55e" },
  ];
  const maxAsm = Math.max(...asmStatus.map(s => s.value), 1);

  // frameworks in use
  const fwUsage: Record<string, number> = {};
  assessments.forEach(a => a.frameworks.forEach(fw => { fwUsage[fw] = (fwUsage[fw] ?? 0) + 1; }));

  // upcoming due dates (next 30 days)
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcoming = assessments
    .filter(a => a.due_date && new Date(a.due_date) >= now && new Date(a.due_date) <= in30 && a.status !== "complete")
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

  // findings with remediation
  const remediationBacklog = openFindings.filter(f => f.remediation_task);

  /* ── render ─────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50">

      {/* ── sticky nav ─────────────────────────────── */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#09090b]/95 backdrop-blur z-10">
        <div className="flex items-center gap-4">
          <Link href="/home" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Image src="/compass-logo-dark.jpg" alt="Compass" width={28} height={28} className="w-7 h-7 object-contain mix-blend-screen" />
            <span className="font-mono font-semibold text-zinc-50 tracking-tight text-sm">Compass</span>
          </div>
          <span className="text-zinc-700">/</span>
          <div className="flex items-center gap-1.5">
            <LayoutDashboard className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-sm text-zinc-400">Control Room</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 bg-red-950/40 border border-red-600/30 text-red-400 text-xs font-medium px-3 py-1.5 rounded-full">
              <AlertTriangle className="w-3 h-3" />
              {criticalCount} critical open
            </div>
          )}

          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportOpen(o => !o)}
              className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 z-20 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden">
                  <p className="text-xs text-zinc-500 px-3 pt-3 pb-1.5 font-medium">Export report as</p>
                  <button
                    onClick={() => handleExport("html")}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                  >
                    <Code2 className="w-4 h-4 text-blue-400" />
                    HTML report
                  </button>
                  <button
                    onClick={() => handleExport("md")}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-violet-400" />
                    Markdown report
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="w-full flex items-center gap-2.5 px-3 pb-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                  >
                    <Table className="w-4 h-4 text-green-400" />
                    Excel workbook
                  </button>
                </div>
              </>
            )}
          </div>

          <button onClick={() => { clearToken(); router.push("/login"); }}
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            <LogOut className="w-4 h-4" /><span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* ── page title ─────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Control Room</h1>
          <p className="text-zinc-500 text-sm mt-0.5">AI Governance Portfolio — executive overview</p>
        </div>

        {/* ── critical alert banner ───────────────────── */}
        {criticalCount > 0 && (
          <div className="flex items-start gap-3 bg-red-950/30 border border-red-600/40 rounded-xl px-5 py-4">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-400">Action Required</p>
              <p className="text-xs text-red-400/70 mt-0.5">
                {criticalCount} critical or high severity finding{criticalCount !== 1 ? "s" : ""} require immediate remediation.
                {stats?.overdue_assessments.length ? ` ${stats.overdue_assessments.length} assessment${stats.overdue_assessments.length !== 1 ? "s are" : " is"} overdue.` : ""}
              </p>
            </div>
          </div>
        )}

        {/* ── health score + headline metrics ─────────── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <p className="text-sm font-semibold text-zinc-50 mb-5">Portfolio Health</p>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <HealthRing score={healthScore} />
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              {[
                { label: "System Coverage", value: `${coverageRate}%`, sub: "systems with assessments", color: "text-blue-400" },
                { label: "Finding Resolution", value: `${resolutionRate}%`, sub: `${resolvedFindings.length} of ${totalFindings} resolved`, color: "text-green-400" },
                { label: "Avg Compliance", value: avgCompliance !== null ? `${Math.round(avgCompliance * 100)}%` : "—", sub: "across all frameworks", color: "text-violet-400" },
                { label: "Overdue", value: stats?.overdue_assessments.length ?? 0, sub: "assessments past due", color: stats?.overdue_assessments.length ? "text-red-400" : "text-zinc-400" },
              ].map(m => (
                <div key={m.label} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                  <p className="text-xs text-zinc-500 mb-1">{m.label}</p>
                  <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                  <p className="text-xs text-zinc-600 mt-1">{m.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── KPI strip ───────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBadge icon={Shield}        label="AI Systems"     value={systems.length}      color="text-blue-400"   bg="bg-blue-600/10"   border="border-blue-600/20" />
          <StatBadge icon={Activity}      label="Assessments"    value={assessments.length}  color="text-violet-400" bg="bg-violet-600/10" border="border-violet-600/20" />
          <StatBadge icon={TrendingUp}    label="Open Findings"  value={openFindings.length} color="text-amber-400"  bg="bg-amber-500/10"  border="border-amber-500/20" />
          <StatBadge icon={AlertTriangle} label="Critical / High" value={criticalCount}
            color={criticalCount > 0 ? "text-red-400" : "text-green-400"}
            bg={criticalCount > 0 ? "bg-red-600/10" : "bg-green-600/10"}
            border={criticalCount > 0 ? "border-red-600/20" : "border-green-600/20"} />
        </div>

        {/* ── risk donut + framework compliance ───────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* risk distribution */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <p className="text-sm font-semibold text-zinc-50 mb-4">Risk Tier Distribution</p>
            <div className="flex items-center gap-6">
              <div className="w-36 h-36 flex-shrink-0">
                <DonutChart data={riskCounts} center={{ value: systems.length, sub: "systems" }} />
              </div>
              <div className="flex-1 space-y-3">
                {riskCounts.map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span className="text-xs text-zinc-400 capitalize">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-zinc-800 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{ width: systems.length ? `${(value/systems.length)*100}%` : "0%", background: color }} />
                      </div>
                      <span className="text-xs text-zinc-500 w-4 text-right">{value}</span>
                    </div>
                  </div>
                ))}
                {systems.length === 0 && <p className="text-xs text-zinc-600">No systems registered yet.</p>}
              </div>
            </div>
          </div>

          {/* framework compliance */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-zinc-50">Framework Compliance</p>
              {avgCompliance !== null && (
                <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                  avg {Math.round(avgCompliance * 100)}%
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {complianceEntries.map(([fw, pct]) => {
                const color = pct === null ? "#3f3f46" : pct >= 0.8 ? "#22c55e" : pct >= 0.5 ? "#facc15" : "#ef4444";
                const statusText = pct === null ? "No data" : pct >= 0.8 ? "On track" : pct >= 0.5 ? "Needs work" : "At risk";
                return (
                  <div key={fw} className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <RadialGauge pct={pct} color={color} size={64} />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>
                        {pct === null ? "—" : `${Math.round(pct * 100)}%`}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-300">{FW_LABELS[fw] ?? fw}</p>
                      <p className="text-xs mt-0.5" style={{ color }}>{statusText}</p>
                      <p className="text-xs text-zinc-600 mt-0.5">{fwUsage[fw] ?? 0} assessment{(fwUsage[fw] ?? 0) !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                );
              })}
              {complianceEntries.length === 0 && <p className="text-xs text-zinc-600 col-span-2">No assessments submitted yet.</p>}
            </div>
          </div>
        </div>

        {/* ── systems at risk + upcoming deadlines ────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* systems at risk */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-zinc-50">Systems at Risk</p>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${systemsAtRisk.length > 0 ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : "bg-green-600/10 text-green-400 border-green-600/20"}`}>
                {systemsAtRisk.length} at risk
              </span>
            </div>
            {systemsAtRisk.length === 0 ? (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">No high-risk systems — all clear.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {systemsAtRisk.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{s.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{s.business_unit ?? "—"}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RISK_PILL[s.risk_tier]}`}>
                      {s.risk_tier}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* upcoming deadlines */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-zinc-50">Upcoming Deadlines</p>
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> next 30 days
              </span>
            </div>
            {upcoming.length === 0 ? (
              <div className="flex items-center gap-2 text-zinc-500">
                <Clock className="w-4 h-4" />
                <span className="text-sm">No assessments due in the next 30 days.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.slice(0, 5).map(a => {
                  const daysLeft = Math.ceil((new Date(a.due_date!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  const urgent = daysLeft <= 7;
                  return (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-200 truncate">
                          {systemById[a.system_id]?.name ?? a.system_id}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">{a.frameworks.map(f => FW_LABELS[f] ?? f).join(", ")}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 ${urgent ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "bg-zinc-800 text-zinc-400 border border-zinc-700"}`}>
                        {daysLeft}d
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── findings severity + assessment pipeline ──── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* findings by severity */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-zinc-50">Open Findings by Severity</p>
              <span className="text-xs text-zinc-500">{openFindings.length} open</span>
            </div>
            <div className="space-y-3">
              {sevCounts.map(({ label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 capitalize w-14">{label}</span>
                  <div className="flex-1 bg-zinc-800 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full transition-all ${SEV_COLOR[label]}`} style={{ width: `${(value / maxSev) * 100}%` }} />
                  </div>
                  <span className="text-xs text-zinc-400 w-4 text-right">{value}</span>
                </div>
              ))}
            </div>
            {totalFindings > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-500">Resolution rate</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-zinc-800 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${resolutionRate}%` }} />
                  </div>
                  <span className="text-xs text-green-400 font-medium">{resolutionRate}%</span>
                </div>
              </div>
            )}
          </div>

          {/* assessment pipeline */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-zinc-50">Assessment Pipeline</p>
              <span className="text-xs text-zinc-500">{assessments.length} total</span>
            </div>
            <div className="space-y-3">
              {asmStatus.map(({ label, value, color, hex }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 w-20">{label}</span>
                  <div className="flex-1 bg-zinc-800 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full transition-all ${color}`} style={{ width: `${(value / maxAsm) * 100}%` }} />
                  </div>
                  <span className="text-xs text-zinc-400 w-4 text-right">{value}</span>
                </div>
              ))}
            </div>
            {Object.keys(fwUsage).length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <p className="text-xs text-zinc-500 mb-2">Frameworks in scope</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(fwUsage).map(([fw, count]) => (
                    <span key={fw} className="text-xs bg-zinc-800 text-zinc-300 border border-zinc-700 px-2 py-0.5 rounded-full">
                      {FW_LABELS[fw] ?? fw} <span className="text-zinc-500">×{count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── overdue assessments ──────────────────────── */}
        {stats && stats.overdue_assessments.length > 0 && (
          <div className="bg-zinc-900 border border-red-600/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="w-4 h-4 text-red-400" />
              <p className="text-sm font-semibold text-red-400">Overdue Assessments ({stats.overdue_assessments.length})</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {stats.overdue_assessments.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-red-950/20 border border-red-900/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{systemById[a.system_id]?.name ?? a.system_id}</p>
                    <p className="text-xs text-zinc-600 font-mono mt-0.5 truncate max-w-[160px]">{a.id}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="text-xs bg-red-600/20 text-red-400 border border-red-600/30 px-2 py-0.5 rounded-full">{a.status}</span>
                    <p className="text-xs text-zinc-600 mt-1">Due: {a.due_date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── remediation backlog ──────────────────────── */}
        {remediationBacklog.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <p className="text-sm font-semibold text-zinc-50">Remediation Backlog</p>
              </div>
              <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                {remediationBacklog.length} task{remediationBacklog.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-2">
              {remediationBacklog.slice(0, 5).map(f => (
                <div key={f.id} className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${
                      f.severity === "critical" || f.severity === "high"
                        ? "bg-red-600/20 text-red-400 border-red-600/30"
                        : "bg-zinc-800 text-zinc-400 border-zinc-700"
                    }`}>{f.severity}</span>
                    <div>
                      <p className="text-sm text-zinc-400">{f.description}</p>
                      <p className="text-xs text-amber-400/70 mt-1">↳ {f.remediation_task}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── AI systems portfolio ─────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-400" />
              <p className="text-sm font-semibold text-zinc-50">AI Systems Portfolio</p>
            </div>
            <span className="text-xs text-zinc-500">{systems.length} registered · {activeSystems.length} active</span>
          </div>
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
                    <th className="text-left pb-3 font-medium">Coverage</th>
                  </tr>
                </thead>
                <tbody>
                  {systems.map(s => (
                    <tr key={s.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 font-medium text-zinc-200">{s.name}</td>
                      <td className="py-3 text-zinc-500">{s.business_unit ?? "—"}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RISK_PILL[s.risk_tier]}`}>{s.risk_tier}</span>
                      </td>
                      <td className="py-3">
                        <span className="text-xs bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded-full">{s.status}</span>
                      </td>
                      <td className="py-3">
                        {assessedSystemIds.has(s.id)
                          ? <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle className="w-3 h-3" /> Assessed</span>
                          : <span className="text-xs text-zinc-600">Not assessed</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── top open findings ────────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-semibold text-zinc-50">Top Open Findings</p>
            <span className="text-xs text-zinc-500">{openFindings.length} total open</span>
          </div>
          {openFindings.length === 0 ? (
            <div className="flex items-center gap-2 text-green-400">
              <Shield className="w-4 h-4" />
              <span className="text-sm">No open findings — all clear.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {openFindings.slice(0, 6).map(f => (
                <div key={f.id} className="flex items-start gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 mt-0.5 ${
                    f.severity === "critical" || f.severity === "high"
                      ? "bg-red-600/20 text-red-400 border-red-600/30"
                      : "bg-zinc-800 text-zinc-400 border-zinc-700"
                  }`}>{f.severity}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-400">{f.description}</p>
                    {f.remediation_task && (
                      <p className="text-xs text-amber-400/60 mt-0.5 truncate">↳ {f.remediation_task}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
