"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import type { AssessmentDetail } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EVIDENCE_BADGE: Record<string, "default" | "secondary" | "destructive"> = {
  collected: "default",
  stale: "secondary",
  missing: "destructive",
};

const FRAMEWORK_LABELS: Record<string, string> = {
  eu_ai_act: "EU AI Act",
  dora: "DORA",
  iso_42001: "ISO 42001",
  nist_ai_rmf: "NIST AI RMF",
};

export default function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recollecting, setRecollecting] = useState(false);
  const [evidenceInputs, setEvidenceInputs] = useState<Record<string, string>>({});
  const [savingEvidence, setSavingEvidence] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    api.assessments
      .get(id)
      .then(setAssessment)
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await api.assessments.submit(id);
      setAssessment((prev) => (prev ? { ...prev, status: "in_review" } : null));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRecollect() {
    setRecollecting(true);
    try {
      await api.assessments.recollect(id);
      window.location.reload();
    } catch {
      // silently ignore — best-effort re-collection
    } finally {
      setRecollecting(false);
    }
  }

  async function handleDownload(format: "json" | "pdf") {
    const token = typeof window !== "undefined" ? localStorage.getItem("compass_access_token") : null;
    const url = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/assessments/${id}/report?format=${format}`;
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `compass-report-${id}.${format}`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function handleEvidenceSave(controlId: string) {
    const payload = evidenceInputs[controlId]?.trim();
    if (!payload) return;
    setSavingEvidence((prev) => ({ ...prev, [controlId]: true }));
    try {
      await api.evidence.upload({ assessment_id: id, control_id: controlId, payload });
      setAssessment((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          controls: prev.controls.map((c) =>
            c.id === controlId
              ? { ...c, evidence_status: "collected", evidence_payload: payload, evidence_source: "manual" }
              : c
          ),
        };
      });
      setEvidenceInputs((prev) => ({ ...prev, [controlId]: "" }));
    } catch {
      // silently ignore — user can retry
    } finally {
      setSavingEvidence((prev) => ({ ...prev, [controlId]: false }));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-500">
        Loading…
      </div>
    );
  }
  if (!assessment) {
    return <div className="p-8 text-red-600">Assessment not found.</div>;
  }

  const frameworks = [...new Set(assessment.controls.map((c) => c.framework))];
  const controlsByFramework = Object.fromEntries(
    frameworks.map((fw) => [fw, assessment.controls.filter((c) => c.framework === fw)])
  );

  const missing = assessment.controls.filter((c) => c.evidence_status === "missing").length;
  const total = assessment.controls.length;
  const complete = total - missing;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Assessment</h1>
            <p className="text-slate-500 text-sm font-mono">{assessment.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge>{assessment.status}</Badge>
            {assessment.status === "draft" && (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit for Review"}
              </Button>
            )}
            <Button variant="outline" onClick={handleRecollect} disabled={recollecting}>
              {recollecting ? "Collecting…" : "Re-collect evidence"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDownload("json")}>
              Export JSON
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDownload("pdf")}>
              Export PDF
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
              <span>
                {complete} of {total} controls complete
              </span>
              <span className={missing > 0 ? "text-red-600" : "text-green-600"}>
                {missing} with missing evidence
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${total > 0 ? (complete / total) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Controls grouped by framework */}
        <Tabs defaultValue={frameworks[0]}>
          <TabsList className="mb-4">
            {frameworks.map((fw) => {
              const fwControls = controlsByFramework[fw];
              const fwMissing = fwControls.filter((c) => c.evidence_status === "missing").length;
              return (
                <TabsTrigger key={fw} value={fw} className="relative">
                  {FRAMEWORK_LABELS[fw] ?? fw}
                  {fwMissing > 0 && (
                    <span className="ml-1.5 text-xs bg-red-100 text-red-700 rounded-full px-1.5 py-0.5">
                      {fwMissing}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {frameworks.map((fw) => (
            <TabsContent key={fw} value={fw} className="space-y-3">
              {controlsByFramework[fw].map((ctrl) => (
                <Card
                  key={ctrl.id}
                  className={
                    ctrl.evidence_status === "missing" || ctrl.evidence_status === "stale"
                      ? "border-orange-200"
                      : ""
                  }
                >
                  <CardContent className="py-4 space-y-3">
                    {/* Control header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-slate-400">
                            {ctrl.framework} · {ctrl.article_ref}
                          </span>
                        </div>
                        <p className="font-medium text-slate-900">{ctrl.title}</p>
                        <p className="text-sm text-slate-500 mt-1">{ctrl.requirement}</p>
                      </div>
                      <Badge variant={EVIDENCE_BADGE[ctrl.evidence_status]}>
                        {ctrl.evidence_status}
                      </Badge>
                    </div>

                    {/* Evidence payload preview — only when collected */}
                    {ctrl.evidence_status === "collected" && ctrl.evidence_payload && (
                      <details className="text-sm">
                        <summary className="cursor-pointer select-none text-blue-600 hover:text-blue-700">
                          View evidence
                          {ctrl.evidence_source ? ` (${ctrl.evidence_source})` : ""}
                        </summary>
                        <pre className="mt-2 text-xs bg-slate-100 rounded-md p-3 overflow-auto max-h-40 whitespace-pre-wrap break-all">
                          {ctrl.evidence_payload}
                        </pre>
                      </details>
                    )}

                    {/* Inline evidence entry — when missing or stale */}
                    {(ctrl.evidence_status === "missing" ||
                      ctrl.evidence_status === "stale") && (
                      <div className="space-y-2 pt-1">
                        <textarea
                          value={evidenceInputs[ctrl.id] ?? ""}
                          onChange={(e) =>
                            setEvidenceInputs((prev) => ({
                              ...prev,
                              [ctrl.id]: e.target.value,
                            }))
                          }
                          placeholder="Paste evidence, notes, or a link to supporting documentation…"
                          className="w-full text-sm border rounded-md p-2 resize-none h-20 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleEvidenceSave(ctrl.id)}
                          disabled={
                            !evidenceInputs[ctrl.id]?.trim() || savingEvidence[ctrl.id]
                          }
                        >
                          {savingEvidence[ctrl.id] ? "Saving…" : "Save evidence"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
