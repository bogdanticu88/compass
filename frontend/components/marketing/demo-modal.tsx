"use client";

import { useState } from "react";
import { X, Mail, Github, Linkedin } from "lucide-react";

export function DemoButton({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)} className={className}>
        Request a Demo
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-xl p-8 max-w-sm w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-zinc-50 font-semibold text-lg mb-1">Request a Demo</h3>
            <p className="text-zinc-500 text-sm mb-6">Reach out directly to schedule a walkthrough.</p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <span className="text-zinc-400 text-xs font-semibold">BT</span>
                </div>
                <span className="text-zinc-200 font-medium">Bogdan Ticu</span>
              </div>

              <a
                href="mailto:bogdanticuoffice@gmail.com"
                className="flex items-center gap-3 text-zinc-400 hover:text-zinc-100 transition-colors group"
              >
                <Mail className="w-4 h-4 flex-shrink-0 text-blue-500" />
                <span className="text-sm group-hover:underline underline-offset-4">bogdanticuoffice@gmail.com</span>
              </a>

              <a
                href="https://github.com/bogdanticu88"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-zinc-400 hover:text-zinc-100 transition-colors group"
              >
                <Github className="w-4 h-4 flex-shrink-0 text-blue-500" />
                <span className="text-sm group-hover:underline underline-offset-4">github.com/bogdanticu88</span>
              </a>

              <a
                href="https://www.linkedin.com/in/bogdanticu"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-zinc-400 hover:text-zinc-100 transition-colors group"
              >
                <Linkedin className="w-4 h-4 flex-shrink-0 text-blue-500" />
                <span className="text-sm group-hover:underline underline-offset-4">linkedin.com/in/bogdanticu</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
