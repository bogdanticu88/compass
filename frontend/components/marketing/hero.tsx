import Link from "next/link";
import Image from "next/image";
import { DemoButton } from "@/components/marketing/demo-modal";

const FRAMEWORKS = ["EU AI Act", "DORA", "ISO 42001", "NIST AI RMF"];

export function Hero() {
  return (
    <section
      className="relative px-6 py-28 md:py-40 max-w-7xl mx-auto"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }}
    >
      <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
        {/* Left: text */}
        <div className="flex-1">
          <h1 className="text-4xl md:text-6xl font-bold text-zinc-50 leading-tight tracking-tight">
            AI Governance Built for Compliance
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-2xl leading-relaxed">
            Compass maps your AI systems against EU AI Act, DORA, ISO 42001, and NIST AI RMF
            with automated evidence collection, role-based dashboards and audit-ready reports.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors text-sm"
            >
              Get Started
            </Link>
            <DemoButton className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100 px-6 py-3 rounded-lg font-medium transition-colors text-sm" />
            <Link
              href="/login"
              className="text-zinc-500 hover:text-zinc-300 underline-offset-4 hover:underline text-sm py-3 transition-colors"
            >
              Sign In →
            </Link>
          </div>

          {/* Framework badges */}
          <div className="mt-10 flex flex-wrap gap-2">
            {FRAMEWORKS.map((fw) => (
              <span
                key={fw}
                className="font-mono text-xs border border-zinc-700 bg-zinc-900 text-zinc-400 px-3 py-1 rounded-full"
              >
                {fw}
              </span>
            ))}
          </div>
        </div>

        {/* Right: logo */}
        <div className="flex-shrink-0 flex items-center justify-center md:w-80 lg:w-96">
          <Image
            src="/compass-logo-dark.jpg"
            alt="Compass — AI Governance"
            width={400}
            height={400}
            className="w-64 md:w-80 lg:w-96 object-contain mix-blend-screen"
            priority
          />
        </div>
      </div>
    </section>
  );
}
