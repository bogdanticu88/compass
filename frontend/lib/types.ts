export type Role = "admin" | "assessor" | "risk_manager" | "executive";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
}

export interface AISystem {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  risk_tier: "unacceptable" | "high" | "limited" | "minimal";
  business_unit: string | null;
  status: "active" | "decommissioned" | "draft";
}

export interface Assessment {
  id: string;
  system_id: string;
  assessor_id: string;
  frameworks: string[];
  status: "draft" | "in_review" | "complete";
  due_date: string | null;
}

export interface Control {
  id: string;
  framework: string;
  article_ref: string;
  title: string;
  requirement: string;
  evidence_status: "collected" | "stale" | "missing";
  evidence_payload: string | null;
  evidence_source: string | null;
}

export interface AssessmentDetail extends Assessment {
  controls: Control[];
}

export interface Finding {
  id: string;
  assessment_id: string;
  control_id: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  remediation_task: string | null;
  status: "open" | "resolved";
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface DashboardStats {
  framework_compliance: Record<string, number | null>;
  overdue_assessments: Array<{
    id: string;
    system_id: string;
    due_date: string;
    status: string;
  }>;
}
