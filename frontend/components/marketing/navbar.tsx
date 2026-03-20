"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Frameworks", href: "#frameworks" },
  { label: "How It Works", href: "#how-it-works" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY >= 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onOutside = (e: MouseEvent) => {
      const nav = document.getElementById("marketing-nav");
      if (nav && !nav.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onOutside);
    };
  }, []);

  return (
    <nav
      id="marketing-nav"
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled ? "bg-zinc-900 border-b border-zinc-800" : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-zinc-50">
          <span className="text-blue-600 text-xl">◈</span>
          <span className="font-mono tracking-tight">Compass</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="#frameworks"
            className="text-sm text-zinc-400 hover:text-zinc-100 border border-zinc-700 hover:border-zinc-500 px-4 py-1.5 rounded-lg transition-colors"
          >
            Request Demo
          </a>
          <Link
            href="/login"
            className="text-sm text-zinc-400 hover:text-zinc-100 border border-zinc-700 hover:border-zinc-500 px-4 py-1.5 rounded-lg transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition-colors font-medium"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-zinc-400 hover:text-zinc-100 p-2"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex flex-col gap-3">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-sm text-zinc-400 hover:text-zinc-100 py-1"
            >
              {l.label}
            </a>
          ))}
          <div className="border-t border-zinc-800 pt-3 flex flex-col gap-2">
            <a
              href="#frameworks"
              onClick={() => setOpen(false)}
              className="text-sm text-zinc-400 hover:text-zinc-100 border border-zinc-700 px-4 py-2 rounded-lg text-center"
            >
              Request Demo
            </a>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="text-sm text-zinc-400 hover:text-zinc-100 border border-zinc-700 px-4 py-2 rounded-lg text-center"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-center font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
