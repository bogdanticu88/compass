import Link from "next/link";
import { ExternalLink } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Frameworks", href: "#frameworks" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Sign In", href: "/login" },
];

export function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left */}
        <div>
          <div className="flex items-center gap-2 font-semibold text-zinc-50">
            <span className="text-blue-600 text-xl">◈</span>
            <span className="font-mono tracking-tight">Compass</span>
          </div>
          <p className="mt-2 text-zinc-600 text-xs">MIT License · Open Source</p>
        </div>

        {/* Center */}
        <div className="flex flex-col gap-2">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors w-fit"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-start">
          <a
            href="https://github.com/bogdanticu88/Compass"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View on GitHub
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-zinc-800 mt-8 pt-8 text-center text-zinc-600 text-xs">
        &copy; 2026 Compass. Built for the AI governance era.
      </div>
    </footer>
  );
}
