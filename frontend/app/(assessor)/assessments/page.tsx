"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { isAuthenticated, clearToken } from "@/lib/auth";
import type { Assessment, AISystem } from "@/lib/types";
import {
  ChevronLeft, LogOut, ClipboardList, Plus, CheckCircle,
  Clock, FileEdit, AlertTriangle, Calendar, Trash2, X,
} from "lucide-react";

const FW_LABELS: Record<string, string> = {
  eu_ai_act: "EU AI Act", dora: "DORA", iso_42001: "ISO 42001",
  nist_ai_rmf: "NIST AI RMF", gdpr: "GDPR",
};

const STATUS_STYLE: Record<string, string> = {
  draft:     "bg-zinc-800 text-zinc-400 border border-zinc-700",
  in_review: "bg-blue-600/20 text-blue-400 border border-blue-600/30",
  complete:  "bg-green-600/20 text-green-400 border border-green-600/30",
};

const STATUS_ICON: Record<string, React.ElementType> = {
  draft: FileEdit, in_review: Clock, complete: CheckCircle,
};

export default function AssessmentsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [systems,     setSystems]     = useState<AISystem[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState<"all" | "draft" | "in_review" | "complete">("all");
  const [confirmId,   setConfirmId]   = useState<string | null>(null);
  const [deleting,    setDeleting]    = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    Promise.all([api.assessments.list(), api.systems.list()])
      .then(([a, s]) => { setAssessments(a); setSystems(s); })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleDelete() {
    if (!confirmId) return;
    setDeleting(true);
    try {
      await api.assessments.delete(confirmId);
      setAssessments(prev => prev.filter(a => a.id !== confirmId));
    } finally {
      setDeleting(false);
      setConfirmId(null);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="text-zinc-500 text-sm animate-pulse">Loading assessments…</div>
    </div>
  );

  const systemById = Object.fromEntries(systems.map(s => [s.id, s]));
  const counts = {
    all:       assessments.length,
    draft:     assessments.filter(a => a.status === "draft").length,
    in_review: assessments.filter(a => a.status === "in_review").length,
    complete:  assessments.filter(a => a.status === "complete").length,
  };
  const visible = filter === "all" ? assessments : assessments.filter(a => a.status === filter);

  const now = new Date();
  const overdue = assessments.filter(a =>
    a.due_date && new Date(a.due_date) < now && a.status !== "complete"
  ).length;

  const confirmAssessment = assessments.find(a => a.id === confirmId);
  const confirmSystem = confirmAssessment ? systemById[confirmAssessment.system_id] : null;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50">

      {/* ── Delete confirmation modal ── */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-600/15 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </div>
                <p className="font-semibold text-zinc-100 text-sm">Delete Assessment</p>
              </div>
              <button onClick={() => setConfirmId(null)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-1">
              <p className="text-sm text-zinc-300">
                Are you sure you want to delete the assessment for{" "}
                <span className="font-semibold text-zinc-100">{confirmSystem?.name ?? "this system"}</span>?
              </p>
              <p className="text-xs text-zinc-500">
                All controls, evidence, and findings will be permanently removed. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? "Deleting…" : "Yes, delete it"}
              </button>
              <button
                onClick={() => setConfirmId(null)}
                disabled={deleting}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-medium py-2 rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* nav */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#09090b]/95 backdrop-blur z-10">
        <div className="flex items-center gap-4">
          <Link href="/home" className="text-zinc-500 hover:text-zinc-300 transition-colors">
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
            <span className="text-sm text-zinc-400">Assessor Workbench</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {overdue > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 bg-red-950/40 border border-red-600/30 text-red-400 text-xs font-medium px-3 py-1.5 rounded-full">
              <AlertTriangle className="w-3 h-3" />
              {overdue} overdue
            </div>
          )}
          <Link href="/assessments/new"
            className="inline-flex items-center gap-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" />
            New Assessment
          </Link>
          <button onClick={() => { clearToken(); router.push("/login"); }}
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            <LogOut className="w-4 h-4" /><span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* title + KPIs */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Assessments</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Manage and track your AI governance assessments</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {([
            ["All",       counts.all,       "text-zinc-400",   "border-zinc-800",        "all"],
            ["Draft",     counts.draft,     "text-zinc-400",   "border-zinc-700",        "draft"],
            ["In Review", counts.in_review, "text-blue-400",   "border-blue-600/20",     "in_review"],
            ["Complete",  counts.complete,  "text-green-400",  "border-green-600/20",    "complete"],
          ] as const).map(([label, count, color, border, key]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`bg-zinc-900 border ${border} rounded-xl p-4 text-left transition-all hover:border-zinc-600 ${filter === key ? "ring-1 ring-zinc-500" : ""}`}>
              <p className="text-xs text-zinc-500 mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{count}</p>
            </button>
          ))}
        </div>

        {/* list */}
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ClipboardList className="w-10 h-10 text-zinc-700 mb-4" />
            <p className="text-zinc-400 font-medium">No assessments yet</p>
            <p className="text-zinc-600 text-sm mt-1 mb-6">Start your first assessment to begin collecting evidence</p>
            <Link href="/assessments/new"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> New Assessment
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map(a => {
              const sys = systemById[a.system_id];
              const Icon = STATUS_ICON[a.status] ?? Clock;
              const isOverdue = a.due_date && new Date(a.due_date) < now && a.status !== "complete";
              const daysLeft = a.due_date
                ? Math.ceil((new Date(a.due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                : null;
              return (
                <div key={a.id} className="group flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl transition-all">
                  <Link href={`/assessments/${a.id}`} className="flex flex-1 items-center justify-between p-4 min-w-0">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        a.status === "complete" ? "bg-green-600/10" : a.status === "in_review" ? "bg-blue-600/10" : "bg-zinc-800"
                      }`}>
                        <Icon className={`w-4 h-4 ${a.status === "complete" ? "text-green-400" : a.status === "in_review" ? "text-blue-400" : "text-zinc-400"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-100 group-hover:text-white transition-colors">
                          {sys?.name ?? "Unknown system"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {a.frameworks.map(fw => (
                            <span key={fw} className="text-xs text-zinc-500">
                              {FW_LABELS[fw] ?? fw}
                            </span>
                          ))}
                          {a.frameworks.length > 0 && (
                            <span className="text-zinc-700 text-xs">·</span>
                          )}
                          <span className="text-xs font-mono text-zinc-600">{a.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      {a.due_date && (
                        <div className={`hidden sm:flex items-center gap-1 text-xs ${isOverdue ? "text-red-400" : daysLeft !== null && daysLeft <= 7 ? "text-orange-400" : "text-zinc-500"}`}>
                          <Calendar className="w-3 h-3" />
                          {isOverdue ? `${Math.abs(daysLeft!)}d overdue` : daysLeft !== null ? `${daysLeft}d` : a.due_date}
                        </div>
                      )}
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[a.status]}`}>
                        {a.status === "in_review" ? "In Review" : a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                      </span>
                    </div>
                  </Link>
                  <button
                    onClick={() => setConfirmId(a.id)}
                    className="mr-3 p-2 text-zinc-600 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete assessment">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
