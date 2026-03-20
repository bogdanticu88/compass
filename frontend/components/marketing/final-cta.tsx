import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="bg-zinc-900 border-y border-zinc-800 py-24 px-6 text-center">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-zinc-50">
          Start governing your AI today.
        </h2>
        <p className="mt-4 text-zinc-400">
          Open source. Self-hosted. Production-ready.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-medium transition-colors text-sm w-full sm:w-auto"
          >
            Get Started
          </Link>
          <a
            href="#frameworks"
            className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100 px-8 py-3 rounded-lg font-medium transition-colors text-sm w-full sm:w-auto"
          >
            Request a Demo
          </a>
        </div>
      </div>
    </section>
  );
}
