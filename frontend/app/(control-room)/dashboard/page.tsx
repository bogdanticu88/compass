"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import type { AISystem, Assessment, Finding, DashboardStats } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const RISK_COLORS: Record<string, string> = {
  unacceptable: "bg-red-600 text-white",
  high: "bg-orange-500 text-white",
  limited: "bg-yellow-400 text-black",
  minimal: "bg-green-500 text-white",
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
      <div className="flex items-center justify-center h-screen text-slate-500">
        Loading…
      </div>
    );
  }

  const openFindings = findings.filter((f) => f.status === "open");
  const criticalCount = openFindings.filter(
    (f) => f.severity === "critical" || f.severity === "high"
  ).length;

  const systemById = Object.fromEntries(systems.map((s) => [s.id, s]));

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Control Room</h1>
          <p className="text-slate-500 mt-1">AI Governance Portfolio</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">AI Systems</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{systems.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{assessments.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Open Findings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{openFindings.length}</p>
            </CardContent>
          </Card>
          <Card className={criticalCount > 0 ? "border-red-300" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Critical / High
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-3xl font-bold ${
                  criticalCount > 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {criticalCount}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Framework compliance */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Framework Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.framework_compliance).map(([fw, pct]) => (
                  <div key={fw}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">
                        {FRAMEWORK_LABELS[fw] ?? fw}
                      </span>
                      <span className="text-slate-500">
                        {pct === null
                          ? "No submitted assessments"
                          : `${Math.round(pct * 100)}%`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          pct !== null && pct >= 0.8
                            ? "bg-green-500"
                            : pct !== null && pct >= 0.5
                            ? "bg-yellow-400"
                            : "bg-red-400"
                        }`}
                        style={{ width: pct === null ? "0%" : `${pct * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overdue assessments */}
        {stats && stats.overdue_assessments.length > 0 && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-700">
                Overdue Assessments ({stats.overdue_assessments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.overdue_assessments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded border border-red-100"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {systemById[a.system_id]?.name ?? a.system_id}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">{a.id}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">{a.status}</Badge>
                      <p className="text-xs text-slate-500 mt-1">Due: {a.due_date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Systems portfolio */}
        <Card>
          <CardHeader>
            <CardTitle>AI Systems Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            {systems.length === 0 ? (
              <p className="text-slate-500 text-sm">No systems registered yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="text-left pb-2 font-medium">System</th>
                    <th className="text-left pb-2 font-medium">Business Unit</th>
                    <th className="text-left pb-2 font-medium">Risk Tier</th>
                    <th className="text-left pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {systems.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{s.name}</td>
                      <td className="py-3 text-slate-500">{s.business_unit ?? "—"}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            RISK_COLORS[s.risk_tier]
                          }`}
                        >
                          {s.risk_tier}
                        </span>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline">{s.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Top open findings */}
        <Card>
          <CardHeader>
            <CardTitle>Top Open Findings</CardTitle>
          </CardHeader>
          <CardContent>
            {openFindings.length === 0 ? (
              <p className="text-slate-500 text-sm">No open findings.</p>
            ) : (
              <div className="space-y-3">
                {openFindings.slice(0, 5).map((f) => (
                  <div
                    key={f.id}
                    className="flex items-start gap-3 p-3 bg-white rounded border"
                  >
                    <Badge
                      variant={
                        f.severity === "critical" || f.severity === "high"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {f.severity}
                    </Badge>
                    <p className="text-sm text-slate-700">{f.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
