const STATS = [
  { value: "4", label: "Compliance Frameworks" },
  { value: "247", label: "Mapped Controls" },
  { value: "6", label: "Connector Integrations" },
  { value: "MIT", label: "Open Source License" },
];

export function MetricsStrip() {
  return (
    <div className="bg-zinc-900 border-y border-zinc-800 py-12">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className={`flex flex-col items-center justify-center py-6 ${
              i < STATS.length - 1 ? "md:border-r border-zinc-800" : ""
            }`}
          >
            <span className="text-3xl font-bold text-zinc-50">{s.value}</span>
            <span className="mt-1 text-xs uppercase tracking-widest text-zinc-500 text-center">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
