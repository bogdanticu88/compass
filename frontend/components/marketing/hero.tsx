import Link from "next/link";

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
      <div className="max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-bold text-zinc-50 leading-tight tracking-tight">
          AI Governance.
          <br />
          Built for Compliance Teams.
        </h1>
        <p className="mt-6 text-lg text-zinc-400 max-w-2xl leading-relaxed">
          Compass maps your AI systems against EU AI Act, DORA, ISO 42001, and NIST AI RMF —
          with automated evidence collection, role-based dashboards, and audit-ready reports.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors text-sm"
          >
            Get Started
          </Link>
          <a
            href="#frameworks"
            className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100 px-6 py-3 rounded-lg font-medium transition-colors text-sm"
          >
            Request a Demo
          </a>
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
    </section>
  );
}
