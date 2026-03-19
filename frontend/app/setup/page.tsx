"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function SetupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });

  useEffect(() => {
    fetch(`${BASE}/api/v1/setup/status`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.needs_setup) router.replace("/login");
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/v1/setup/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.status === 409) {
        router.replace("/login");
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Setup failed" }));
        setError(err.detail ?? "Setup failed");
        return;
      }
      router.replace("/login?setup=done");
    } catch {
      setError("Could not connect to server");
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-500">
        Checking setup status…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to Compass</CardTitle>
          <p className="text-slate-500 text-sm mt-1">
            Create your admin account to get started.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Full name</label>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Jane Smith"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="admin@yourorg.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Min. 8 characters"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Creating account…" : "Create admin account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
