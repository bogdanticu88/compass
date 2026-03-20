import { getToken } from "./auth";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}/api/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }

  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<import("./types").TokenResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    register: (email: string, password: string, full_name: string) =>
      request<import("./types").TokenResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, full_name }),
      }),
    me: () => request<import("./types").User>("/auth/me"),
  },
  systems: {
    list: () => request<import("./types").AISystem[]>("/systems"),
    create: (data: Partial<import("./types").AISystem>) =>
      request<import("./types").AISystem>("/systems", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    get: (id: string) => request<import("./types").AISystem>(`/systems/${id}`),
  },
  assessments: {
    list: () => request<import("./types").Assessment[]>("/assessments"),
    create: (data: { system_id: string; frameworks: string[]; due_date?: string }) =>
      request<import("./types").Assessment>("/assessments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    get: (id: string) =>
      request<import("./types").AssessmentDetail>(`/assessments/${id}`),
    submit: (id: string) =>
      request<import("./types").Assessment>(`/assessments/${id}/submit`, {
        method: "POST",
      }),
    recollect: (id: string) =>
      request<{ message: string }>(`/assessments/${id}/recollect`, { method: "POST" }),
    delete: (id: string) =>
      request<void>(`/assessments/${id}`, { method: "DELETE" }),
  },
  findings: {
    list: (assessmentId?: string) =>
      request<import("./types").Finding[]>(
        `/findings${assessmentId ? `?assessment_id=${assessmentId}` : ""}`
      ),
  },
  dashboard: {
    stats: () => request<import("./types").DashboardStats>("/dashboard"),
  },
  evidence: {
    upload: (data: { assessment_id: string; control_id: string; payload: string }) =>
      request<{ id: string; status: string }>("/evidence", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  reports: {
    downloadUrl: (id: string, format: "json" | "pdf") =>
      `${BASE}/api/v1/assessments/${id}/report?format=${format}`,
  },
};
