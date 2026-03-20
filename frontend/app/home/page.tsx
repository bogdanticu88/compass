"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, ClipboardList, ArrowRight, LogOut } from "lucide-react";
import { isAuthenticated, clearToken } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  function handleSignOut() {
    clearToken();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      {/* Top bar */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <Image
            src="/compass-logo-dark.jpg"
            alt="Compass"
            width={32}
            height={32}
            className="w-8 h-8 object-contain mix-blend-screen"
          />
          <span className="font-mono font-semibold text-zinc-50 tracking-tight">Compass</span>
        </div>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-50 tracking-tight">
            Where are you headed?
          </h1>
          <p className="mt-3 text-zinc-500 text-sm">
            Choose your workspace to continue.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
          {/* Control Room */}
          <Link
            href="/dashboard"
            className="group bg-zinc-900 border border-zinc-800 hover:border-blue-600/60 rounded-xl p-8 flex flex-col gap-4 transition-all duration-200 hover:bg-zinc-900/80"
          >
            <div className="w-12 h-12 rounded-lg bg-blue-600/10 border border-blue-600/20 flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
              <LayoutDashboard className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-zinc-50 font-semibold text-lg">Control Room</h2>
              <p className="text-zinc-500 text-sm mt-1 leading-relaxed">
                Executive portfolio view. Monitor AI system risk, framework compliance, and open findings across your organisation.
              </p>
            </div>
            <div className="flex items-center gap-2 text-blue-500 text-sm font-medium">
              Enter
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Assessor Workbench */}
          <Link
            href="/assessments"
            className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-500/60 rounded-xl p-8 flex flex-col gap-4 transition-all duration-200 hover:bg-zinc-900/80"
          >
            <div className="w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center group-hover:bg-zinc-700/50 transition-colors">
              <ClipboardList className="w-6 h-6 text-zinc-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-zinc-50 font-semibold text-lg">Assessor Workbench</h2>
              <p className="text-zinc-500 text-sm mt-1 leading-relaxed">
                Assessor workspace. Run control assessments, collect evidence, and manage findings across all active frameworks.
              </p>
            </div>
            <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium">
              Enter
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      <div className="text-center pb-8 text-xs text-zinc-700">
        Compass · AI Governance Platform · MIT License
      </div>
    </div>
  );
}
