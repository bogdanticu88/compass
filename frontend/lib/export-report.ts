import type { AISystem, Assessment, Finding, DashboardStats } from "./types";

const FW_LABELS: Record<string, string> = {
  eu_ai_act: "EU AI Act",
  dora: "DORA",
  iso_42001: "ISO 42001",
  nist_ai_rmf: "NIST AI RMF",
  gdpr: "GDPR",
};

interface ReportData {
  systems: AISystem[];
  assessments: Assessment[];
  findings: Finding[];
  stats: DashboardStats;
  generatedAt: Date;
}

/* ── shared derived values ─────────────────────────── */
function derive(d: ReportData) {
  const systemById = Object.fromEntries(d.systems.map(s => [s.id, s]));
  const activeSystems = d.systems.filter(s => s.status === "active");
  const openFindings = d.findings.filter(f => f.status === "open");
  const resolvedFindings = d.findings.filter(f => f.status === "resolved");
  const criticalCount = openFindings.filter(f => f.severity === "critical" || f.severity === "high").length;
  const assessedSystemIds = new Set(d.assessments.map(a => a.system_id));
  const coverageRate = activeSystems.length
    ? Math.round((activeSystems.filter(s => assessedSystemIds.has(s.id)).length / activeSystems.length) * 100)
    : 0;
  const resolutionRate = d.findings.length
    ? Math.round((resolvedFindings.length / d.findings.length) * 100)
    : 0;
  const complianceEntries = Object.entries(d.stats.framework_compliance);
  const filledEntries = complianceEntries.filter(([, v]) => v !== null);
  const avgCompliance = filledEntries.length
    ? filledEntries.reduce((s, [, v]) => s + (v as number), 0) / filledEntries.length
    : null;
  const healthScore = (() => {
    if (d.systems.length === 0) return 0;
    let score = avgCompliance !== null ? avgCompliance * 100 : 50;
    const highRiskRatio = d.systems.filter(s => s.risk_tier === "unacceptable" || s.risk_tier === "high").length / d.systems.length;
    score -= highRiskRatio * 20;
    score -= criticalCount * 3;
    score -= (d.stats.overdue_assessments.length) * 5;
    return Math.max(0, Math.min(100, Math.round(score)));
  })();
  const healthLabel = healthScore >= 75 ? "Healthy" : healthScore >= 50 ? "Needs Attention" : "At Risk";
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcoming = d.assessments
    .filter(a => a.due_date && new Date(a.due_date) >= now && new Date(a.due_date) <= in30 && a.status !== "complete")
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());
  const fwUsage: Record<string, number> = {};
  d.assessments.forEach(a => a.frameworks.forEach(fw => { fwUsage[fw] = (fwUsage[fw] ?? 0) + 1; }));
  return {
    systemById, activeSystems, openFindings, resolvedFindings, criticalCount,
    assessedSystemIds, coverageRate, resolutionRate, avgCompliance, healthScore,
    healthLabel, upcoming, fwUsage, complianceEntries,
  };
}

/* ════════════════════════════════════════════════════
   MARKDOWN EXPORT
════════════════════════════════════════════════════ */
export function generateMarkdown(d: ReportData): string {
  const v = derive(d);
  const ts = d.generatedAt.toISOString().replace("T", " ").substring(0, 19) + " UTC";
  const lines: string[] = [];

  const h1 = (t: string) => lines.push(`# ${t}\n`);
  const h2 = (t: string) => lines.push(`## ${t}\n`);
  const h3 = (t: string) => lines.push(`### ${t}\n`);
  const p  = (t: string) => lines.push(`${t}\n`);
  const hr = ()          => lines.push(`---\n`);

  h1("Compass — AI Governance Control Room Report");
  p(`**Generated:** ${ts}`);
  p(`**Total AI Systems:** ${d.systems.length}  |  **Active:** ${v.activeSystems.length}  |  **Assessments:** ${d.assessments.length}  |  **Open Findings:** ${v.openFindings.length}`);
  hr();

  /* Executive Summary */
  h2("Executive Summary");
  p(`| Metric | Value |`);
  p(`| --- | --- |`);
  p(`| Portfolio Health Score | **${v.healthScore}/100** — ${v.healthLabel} |`);
  p(`| System Coverage | ${v.coverageRate}% of active systems assessed |`);
  p(`| Finding Resolution Rate | ${v.resolutionRate}% (${v.resolvedFindings.length} of ${d.findings.length} resolved) |`);
  p(`| Avg Framework Compliance | ${v.avgCompliance !== null ? `${Math.round(v.avgCompliance * 100)}%` : "No data"} |`);
  p(`| Critical / High Findings | ${v.criticalCount} open |`);
  p(`| Overdue Assessments | ${d.stats.overdue_assessments.length} |`);

  if (v.criticalCount > 0) {
    p(`\n> ⚠️ **Action Required:** ${v.criticalCount} critical or high severity finding${v.criticalCount !== 1 ? "s" : ""} require immediate remediation.`);
  }
  hr();

  /* Framework Compliance */
  h2("Framework Compliance");
  if (v.complianceEntries.length === 0) {
    p("No assessments submitted yet.");
  } else {
    p(`| Framework | Compliance | Status | Assessments |`);
    p(`| --- | --- | --- | --- |`);
    v.complianceEntries.forEach(([fw, pct]) => {
      const pctStr = pct === null ? "—" : `${Math.round((pct as number) * 100)}%`;
      const status = pct === null ? "No data" : (pct as number) >= 0.8 ? "✅ On track" : (pct as number) >= 0.5 ? "⚠️ Needs work" : "❌ At risk";
      p(`| ${FW_LABELS[fw] ?? fw} | ${pctStr} | ${status} | ${v.fwUsage[fw] ?? 0} |`);
    });
  }
  hr();

  /* Risk Tier Distribution */
  h2("Risk Tier Distribution");
  const riskTiers = ["unacceptable", "high", "limited", "minimal"] as const;
  p(`| Risk Tier | Count | % of Portfolio |`);
  p(`| --- | --- | --- |`);
  riskTiers.forEach(tier => {
    const count = d.systems.filter(s => s.risk_tier === tier).length;
    const pct = d.systems.length ? Math.round((count / d.systems.length) * 100) : 0;
    p(`| ${tier.charAt(0).toUpperCase() + tier.slice(1)} | ${count} | ${pct}% |`);
  });
  hr();

  /* AI Systems Portfolio */
  h2("AI Systems Portfolio");
  if (d.systems.length === 0) {
    p("No systems registered.");
  } else {
    p(`| System | Business Unit | Risk Tier | Status | Coverage |`);
    p(`| --- | --- | --- | --- | --- |`);
    d.systems.forEach(s => {
      const covered = v.assessedSystemIds.has(s.id) ? "✅ Assessed" : "⬜ Not assessed";
      p(`| **${s.name}** | ${s.business_unit ?? "—"} | ${s.risk_tier} | ${s.status} | ${covered} |`);
    });
    const withDesc = d.systems.filter(s => s.description);
    if (withDesc.length > 0) {
      h3("System Descriptions");
      withDesc.forEach(s => {
        p(`**${s.name}**`);
        p(s.description!);
      });
    }
  }
  hr();

  /* Assessment Pipeline */
  h2("Assessment Pipeline");
  if (d.assessments.length === 0) {
    p("No assessments on record.");
  } else {
    p(`| System | Frameworks | Status | Due Date |`);
    p(`| --- | --- | --- | --- |`);
    d.assessments.forEach(a => {
      const sysName = v.systemById[a.system_id]?.name ?? a.system_id;
      const fws = a.frameworks.map(f => FW_LABELS[f] ?? f).join(", ");
      p(`| ${sysName} | ${fws} | ${a.status} | ${a.due_date ?? "—"} |`);
    });
  }
  hr();

  /* Upcoming Deadlines */
  if (v.upcoming.length > 0) {
    h2("Upcoming Deadlines (Next 30 Days)");
    p(`| System | Frameworks | Due Date | Days Left |`);
    p(`| --- | --- | --- | --- |`);
    const now = new Date();
    v.upcoming.forEach(a => {
      const sysName = v.systemById[a.system_id]?.name ?? a.system_id;
      const fws = a.frameworks.map(f => FW_LABELS[f] ?? f).join(", ");
      const daysLeft = Math.ceil((new Date(a.due_date!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      p(`| ${sysName} | ${fws} | ${a.due_date} | ${daysLeft}d |`);
    });
    hr();
  }

  /* Overdue Assessments */
  if (d.stats.overdue_assessments.length > 0) {
    h2("Overdue Assessments");
    p(`| System | Assessment ID | Status | Due Date |`);
    p(`| --- | --- | --- | --- |`);
    d.stats.overdue_assessments.forEach(a => {
      const sysName = v.systemById[a.system_id]?.name ?? a.system_id;
      p(`| ${sysName} | \`${a.id}\` | ${a.status} | ${a.due_date} |`);
    });
    hr();
  }

  /* Open Findings */
  h2("Open Findings");
  if (v.openFindings.length === 0) {
    p("✅ No open findings.");
  } else {
    const sevOrder = ["critical", "high", "medium", "low"];
    const sorted = [...v.openFindings].sort(
      (a, b) => sevOrder.indexOf(a.severity) - sevOrder.indexOf(b.severity)
    );
    p(`| Severity | Description | Remediation Task |`);
    p(`| --- | --- | --- |`);
    sorted.forEach(f => {
      const sev = f.severity.toUpperCase();
      p(`| **${sev}** | ${f.description} | ${f.remediation_task ?? "—"} |`);
    });

    /* Findings by severity summary */
    h3("Findings Summary");
    sevOrder.forEach(sev => {
      const count = v.openFindings.filter(f => f.severity === sev).length;
      p(`- **${sev.charAt(0).toUpperCase() + sev.slice(1)}:** ${count}`);
    });
  }
  hr();

  /* Remediation Backlog */
  const backlog = v.openFindings.filter(f => f.remediation_task);
  if (backlog.length > 0) {
    h2("Remediation Backlog");
    backlog.forEach((f, i) => {
      p(`${i + 1}. **[${f.severity.toUpperCase()}]** ${f.description}`);
      p(`   - Task: ${f.remediation_task}`);
    });
    hr();
  }

  p(`*Report generated by Compass AI Governance Platform · ${ts}*`);

  return lines.join("\n");
}

/* ════════════════════════════════════════════════════
   HTML EXPORT
════════════════════════════════════════════════════ */
export function generateHTML(d: ReportData): string {
  const v = derive(d);
  const ts = d.generatedAt.toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" });
  const healthColor = v.healthScore >= 75 ? "#22c55e" : v.healthScore >= 50 ? "#facc15" : "#ef4444";
  const riskColors: Record<string, string> = {
    unacceptable: "#ef4444", high: "#f97316", limited: "#facc15", minimal: "#22c55e",
  };
  const sevColors: Record<string, string> = {
    critical: "#ef4444", high: "#f97316", medium: "#facc15", low: "#71717a",
  };
  const pctColor = (pct: number | null) =>
    pct === null ? "#52525b" : pct >= 0.8 ? "#22c55e" : pct >= 0.5 ? "#facc15" : "#ef4444";

  const badge = (text: string, color: string, bg: string) =>
    `<span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;background:${bg};color:${color};border:1px solid ${color}40">${text}</span>`;

  const table = (headers: string[], rows: string[][]) => `
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px">
      <thead>
        <tr>${headers.map(h => `<th style="text-align:left;padding:8px 12px;border-bottom:1px solid #27272a;color:#71717a;font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:.05em">${h}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${rows.map((row, i) => `<tr style="border-bottom:1px solid ${i === rows.length - 1 ? "transparent" : "#1f1f22"}">${row.map(cell => `<td style="padding:10px 12px;color:#d4d4d8;vertical-align:top">${cell}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>`;

  const section = (title: string, body: string, borderColor = "#27272a") => `
    <div style="background:#111113;border:1px solid ${borderColor};border-radius:12px;padding:24px;margin-bottom:20px">
      <h2 style="margin:0 0 16px;font-size:14px;font-weight:600;color:#fafafa">${title}</h2>
      ${body}
    </div>`;

  const kpiCard = (label: string, value: string | number, color: string) => `
    <div style="background:#0a0a0c;border:1px solid #27272a;border-radius:10px;padding:16px;text-align:center">
      <div style="font-size:11px;color:#71717a;margin-bottom:6px">${label}</div>
      <div style="font-size:26px;font-weight:700;color:${color}">${value}</div>
    </div>`;

  /* ── sections ── */

  const kpiGrid = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
      ${kpiCard("AI Systems", d.systems.length, "#60a5fa")}
      ${kpiCard("Assessments", d.assessments.length, "#a78bfa")}
      ${kpiCard("Open Findings", v.openFindings.length, "#fb923c")}
      ${kpiCard("Critical / High", v.criticalCount, v.criticalCount > 0 ? "#f87171" : "#4ade80")}
    </div>`;

  const healthSection = section("Portfolio Health", `
    <div style="display:grid;grid-template-columns:auto 1fr;gap:32px;align-items:center">
      <div style="text-align:center">
        <div style="font-size:48px;font-weight:700;color:${healthColor};line-height:1">${v.healthScore}</div>
        <div style="font-size:12px;color:${healthColor};margin-top:4px">${v.healthLabel}</div>
        <div style="font-size:11px;color:#52525b;margin-top:2px">out of 100</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        ${[
          ["System Coverage", `${v.coverageRate}%`, "#60a5fa", `${v.activeSystems.filter(s => v.assessedSystemIds.has(s.id)).length} of ${v.activeSystems.length} systems`],
          ["Finding Resolution", `${v.resolutionRate}%`, "#4ade80", `${v.resolvedFindings.length} of ${d.findings.length} resolved`],
          ["Avg Compliance", v.avgCompliance !== null ? `${Math.round(v.avgCompliance * 100)}%` : "—", "#c084fc", "across all frameworks"],
          ["Overdue", d.stats.overdue_assessments.length, d.stats.overdue_assessments.length > 0 ? "#f87171" : "#71717a", "assessments past due"],
        ].map(([label, value, color, sub]) => `
          <div style="background:#0a0a0c;border:1px solid #27272a;border-radius:8px;padding:14px">
            <div style="font-size:11px;color:#71717a;margin-bottom:4px">${label}</div>
            <div style="font-size:22px;font-weight:700;color:${color}">${value}</div>
            <div style="font-size:11px;color:#3f3f46;margin-top:4px">${sub}</div>
          </div>`).join("")}
      </div>
    </div>`);

  const fwSection = section("Framework Compliance", v.complianceEntries.length === 0
    ? `<p style="color:#52525b;font-size:13px">No assessments submitted yet.</p>`
    : table(
        ["Framework", "Compliance", "Status", "Assessments"],
        v.complianceEntries.map(([fw, pct]) => {
          const c = pctColor(pct as number | null);
          const pctStr = pct === null ? "—" : `${Math.round((pct as number) * 100)}%`;
          const status = pct === null ? "No data" : (pct as number) >= 0.8 ? "On track" : (pct as number) >= 0.5 ? "Needs work" : "At risk";
          return [
            `<strong style="color:#e4e4e7">${FW_LABELS[fw] ?? fw}</strong>`,
            `<span style="font-weight:700;color:${c}">${pctStr}</span>`,
            badge(status, c, c + "20"),
            String(v.fwUsage[fw] ?? 0),
          ];
        })
      )
  );

  const riskSection = section("Risk Tier Distribution", table(
    ["Risk Tier", "Count", "% of Portfolio"],
    (["unacceptable", "high", "limited", "minimal"] as const).map(tier => {
      const count = d.systems.filter(s => s.risk_tier === tier).length;
      const pct = d.systems.length ? Math.round((count / d.systems.length) * 100) : 0;
      const c = riskColors[tier];
      return [badge(tier, c, c + "20"), String(count), `${pct}%`];
    })
  ));

  const systemsSection = section("AI Systems Portfolio", d.systems.length === 0
    ? `<p style="color:#52525b;font-size:13px">No systems registered.</p>`
    : table(
        ["System", "Business Unit", "Risk Tier", "Status", "Coverage"],
        d.systems.map(s => {
          const c = riskColors[s.risk_tier];
          const covered = v.assessedSystemIds.has(s.id)
            ? `<span style="color:#4ade80;font-size:12px">✓ Assessed</span>`
            : `<span style="color:#52525b;font-size:12px">Not assessed</span>`;
          return [
            `<div><strong style="color:#fafafa">${s.name}</strong>${s.description ? `<div style="font-size:11px;color:#52525b;margin-top:2px;max-width:260px">${s.description}</div>` : ""}</div>`,
            s.business_unit ?? "—",
            badge(s.risk_tier, c, c + "20"),
            `<span style="font-size:12px;color:#a1a1aa">${s.status}</span>`,
            covered,
          ];
        })
      )
  );

  const pipelineSection = section("Assessment Pipeline", d.assessments.length === 0
    ? `<p style="color:#52525b;font-size:13px">No assessments on record.</p>`
    : table(
        ["System", "Frameworks", "Status", "Due Date"],
        d.assessments.map(a => {
          const sysName = v.systemById[a.system_id]?.name ?? a.system_id;
          const fws = a.frameworks.map(f => FW_LABELS[f] ?? f).join(", ");
          const statusColor = a.status === "complete" ? "#4ade80" : a.status === "in_review" ? "#60a5fa" : "#71717a";
          return [
            `<strong style="color:#e4e4e7">${sysName}</strong>`,
            `<span style="font-size:12px;color:#a1a1aa">${fws}</span>`,
            badge(a.status, statusColor, statusColor + "20"),
            a.due_date ?? "—",
          ];
        })
      )
  );

  let deadlinesHTML = "";
  if (v.upcoming.length > 0) {
    const now2 = new Date();
    deadlinesHTML = section("Upcoming Deadlines (Next 30 Days)", table(
      ["System", "Frameworks", "Due Date", "Days Left"],
      v.upcoming.map(a => {
        const sysName = v.systemById[a.system_id]?.name ?? a.system_id;
        const fws = a.frameworks.map(f => FW_LABELS[f] ?? f).join(", ");
        const daysLeft = Math.ceil((new Date(a.due_date!).getTime() - now2.getTime()) / (1000 * 60 * 60 * 24));
        const urgentColor = daysLeft <= 7 ? "#fb923c" : "#71717a";
        return [
          `<strong style="color:#e4e4e7">${sysName}</strong>`,
          `<span style="font-size:12px;color:#a1a1aa">${fws}</span>`,
          a.due_date!,
          `<span style="font-weight:700;color:${urgentColor}">${daysLeft}d</span>`,
        ];
      })
    ));
  }

  let overdueHTML = "";
  if (d.stats.overdue_assessments.length > 0) {
    overdueHTML = section("Overdue Assessments", table(
      ["System", "Assessment ID", "Status", "Due Date"],
      d.stats.overdue_assessments.map(a => {
        const sysName = v.systemById[a.system_id]?.name ?? a.system_id;
        return [
          `<strong style="color:#e4e4e7">${sysName}</strong>`,
          `<code style="font-size:11px;color:#71717a">${a.id}</code>`,
          badge(a.status, "#f87171", "#ef444420"),
          `<span style="color:#f87171">${a.due_date}</span>`,
        ];
      })
    ), "#7f1d1d");
  }

  const sevOrder = ["critical", "high", "medium", "low"];
  const sortedFindings = [...v.openFindings].sort(
    (a, b) => sevOrder.indexOf(a.severity) - sevOrder.indexOf(b.severity)
  );
  const findingsSection = section("Open Findings", v.openFindings.length === 0
    ? `<div style="color:#4ade80;font-size:13px">✓ No open findings — all clear.</div>`
    : `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">
        ${sevOrder.map(sev => {
          const count = v.openFindings.filter(f => f.severity === sev).length;
          const c = sevColors[sev];
          return `<div style="background:#0a0a0c;border:1px solid ${c}30;border-radius:8px;padding:12px;text-align:center">
            <div style="font-size:11px;color:#71717a;text-transform:capitalize;margin-bottom:4px">${sev}</div>
            <div style="font-size:22px;font-weight:700;color:${c}">${count}</div>
          </div>`;
        }).join("")}
      </div>
      ${table(
        ["Severity", "Description", "Remediation Task"],
        sortedFindings.map(f => {
          const c = sevColors[f.severity];
          return [
            badge(f.severity.toUpperCase(), c, c + "20"),
            `<span style="color:#d4d4d8">${f.description}</span>`,
            f.remediation_task
              ? `<span style="color:#fbbf24;font-size:12px">${f.remediation_task}</span>`
              : `<span style="color:#3f3f46">—</span>`,
          ];
        })
      )}`
  );

  const backlog = v.openFindings.filter(f => f.remediation_task);
  let backlogHTML = "";
  if (backlog.length > 0) {
    backlogHTML = section("Remediation Backlog", `
      <div style="display:flex;flex-direction:column;gap:8px">
        ${backlog.map(f => {
          const c = sevColors[f.severity];
          return `<div style="background:#0a0a0c;border:1px solid #27272a;border-radius:8px;padding:12px;display:flex;gap:12px;align-items:flex-start">
            ${badge(f.severity.toUpperCase(), c, c + "20")}
            <div>
              <div style="color:#d4d4d8;font-size:13px">${f.description}</div>
              <div style="color:#fbbf24;font-size:12px;margin-top:4px">↳ ${f.remediation_task}</div>
            </div>
          </div>`;
        }).join("")}
      </div>`);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Compass Control Room Report — ${ts}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #09090b; color: #d4d4d8; line-height: 1.5; padding: 40px 24px; }
    @media print { body { background: #fff; color: #111; } }
    .container { max-width: 1100px; margin: 0 auto; }
    table { border-spacing: 0; }
    code { font-family: monospace; }
    strong { color: inherit; }
  </style>
</head>
<body>
  <div class="container">

    <div style="margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid #27272a">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <div style="font-family:monospace;font-size:18px;font-weight:700;color:#fafafa;letter-spacing:-.02em">Compass</div>
          <div style="font-size:22px;font-weight:700;color:#fafafa;margin-top:4px">AI Governance Control Room Report</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:12px;color:#52525b">Generated</div>
          <div style="font-size:13px;color:#a1a1aa">${ts}</div>
        </div>
      </div>
      ${v.criticalCount > 0 ? `
      <div style="margin-top:16px;background:#1c0707;border:1px solid #7f1d1d;border-radius:8px;padding:12px 16px;color:#f87171;font-size:13px">
        ⚠️ <strong>Action Required:</strong> ${v.criticalCount} critical or high severity finding${v.criticalCount !== 1 ? "s" : ""} require immediate remediation.${d.stats.overdue_assessments.length ? ` ${d.stats.overdue_assessments.length} assessment${d.stats.overdue_assessments.length !== 1 ? "s are" : " is"} overdue.` : ""}
      </div>` : ""}
    </div>

    ${kpiGrid}
    ${healthSection}
    ${fwSection}
    ${riskSection}
    ${systemsSection}
    ${pipelineSection}
    ${deadlinesHTML}
    ${overdueHTML}
    ${findingsSection}
    ${backlogHTML}

    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #27272a;text-align:center;font-size:11px;color:#3f3f46">
      Compass AI Governance Platform · Report generated ${ts}
    </div>

  </div>
</body>
</html>`;
}

/* ── download helpers ─────────────────────────────── */
export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Excel export (.xlsx) ─────────────────────────── */
export async function generateExcel(d: ReportData): Promise<void> {
  const XLSX = await import("xlsx");
  const { stats, systemById, openFindings, coverageRate } = (() => {
    const systemById = Object.fromEntries(d.systems.map(s => [s.id, s]));
    const openFindings = d.findings.filter(f => f.status === "open");
    const assessedSystemIds = new Set(d.assessments.map(a => a.system_id));
    const activeSystems = d.systems.filter(s => s.status === "active");
    const coverageRate = activeSystems.length
      ? Math.round((activeSystems.filter(s => assessedSystemIds.has(s.id)).length / activeSystems.length) * 100)
      : 0;
    return { stats: d.stats, systemById, openFindings, coverageRate };
  })();

  const wb = XLSX.utils.book_new();

  /* ── Sheet 1: Summary ── */
  const summaryRows = [
    ["Compass AI Governance — Control Room Report"],
    ["Generated", d.generatedAt.toLocaleString()],
    [],
    ["Metric", "Value"],
    ["Total AI Systems", d.systems.length],
    ["Active Systems", d.systems.filter(s => s.status === "active").length],
    ["Total Assessments", d.assessments.length],
    ["Draft", d.assessments.filter(a => a.status === "draft").length],
    ["In Review", d.assessments.filter(a => a.status === "in_review").length],
    ["Complete", d.assessments.filter(a => a.status === "complete").length],
    ["Open Findings", openFindings.length],
    ["Critical / High", openFindings.filter(f => f.severity === "critical" || f.severity === "high").length],
    ["System Coverage", `${coverageRate}%`],
    ["Overall Score", stats.overall_score != null ? `${stats.overall_score}%` : "N/A"],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary["!cols"] = [{ wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  /* ── Sheet 2: Framework Compliance ── */
  const fwRows = [["Framework", "Compliance %", "Assessed Assessments"]];
  for (const [fw, score] of Object.entries(stats.framework_scores ?? {})) {
    const fwAssessments = d.assessments.filter(a => a.frameworks?.includes(fw)).length;
    fwRows.push([FW_LABELS[fw] ?? fw, score != null ? `${Math.round(score * 100)}%` : "N/A", fwAssessments]);
  }
  const wsFw = XLSX.utils.aoa_to_sheet(fwRows);
  wsFw["!cols"] = [{ wch: 20 }, { wch: 18 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsFw, "Framework Compliance");

  /* ── Sheet 3: Systems ── */
  const sysRows = [["Name", "Risk Tier", "Status", "Business Unit", "Description"]];
  for (const s of d.systems) {
    sysRows.push([s.name, s.risk_tier ?? "", s.status ?? "", s.business_unit ?? "", s.description ?? ""]);
  }
  const wsSys = XLSX.utils.aoa_to_sheet(sysRows);
  wsSys["!cols"] = [{ wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 20 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsSys, "AI Systems");

  /* ── Sheet 4: Assessments ── */
  const assessRows = [["System", "Frameworks", "Status", "Due Date", "Assessment ID"]];
  for (const a of d.assessments) {
    const sys = systemById[a.system_id];
    assessRows.push([
      sys?.name ?? a.system_id,
      (a.frameworks ?? []).map((f: string) => FW_LABELS[f] ?? f).join(", "),
      a.status,
      a.due_date ?? "",
      a.id,
    ]);
  }
  const wsAssess = XLSX.utils.aoa_to_sheet(assessRows);
  wsAssess["!cols"] = [{ wch: 28 }, { wch: 40 }, { wch: 12 }, { wch: 14 }, { wch: 38 }];
  XLSX.utils.book_append_sheet(wb, wsAssess, "Assessments");

  /* ── Sheet 5: Open Findings ── */
  const findRows = [["System", "Severity", "Description", "Remediation", "Status"]];
  for (const f of openFindings) {
    const sys = systemById[d.assessments.find(a => a.id === f.assessment_id)?.system_id ?? ""];
    findRows.push([
      sys?.name ?? "",
      f.severity,
      f.description,
      f.remediation_task ?? "",
      f.status,
    ]);
  }
  const wsFind = XLSX.utils.aoa_to_sheet(findRows);
  wsFind["!cols"] = [{ wch: 28 }, { wch: 12 }, { wch: 60 }, { wch: 40 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsFind, "Open Findings");

  /* ── Sheet 6: Deadlines ── */
  const now = new Date();
  const deadlineRows = [["System", "Status", "Due Date", "Days Remaining"]];
  for (const a of d.assessments.filter(a => a.due_date && a.status !== "complete")) {
    const sys = systemById[a.system_id];
    const due = new Date(a.due_date!);
    const days = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    deadlineRows.push([sys?.name ?? a.system_id, a.status, a.due_date!, days < 0 ? `OVERDUE (${Math.abs(days)}d)` : `${days}d`]);
  }
  const wsDeadlines = XLSX.utils.aoa_to_sheet(deadlineRows);
  wsDeadlines["!cols"] = [{ wch: 28 }, { wch: 12 }, { wch: 14 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsDeadlines, "Deadlines");

  /* ── write and download ── */
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `compass-report-${d.generatedAt.toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
