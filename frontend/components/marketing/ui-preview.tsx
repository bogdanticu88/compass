const FRAMEWORKS = ["EU AI Act", "DORA", "ISO 42001", "NIST AI RMF"];
const STATS = ["AI Systems", "Assessments", "Open Findings", "Critical / High"];

export function UIPreview() {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-zinc-50">
          A control room built for governance teams.
        </h2>
        <p className="mt-4 text-zinc-400 max-w-2xl">
          Executives see portfolio risk at a glance. Assessment teams drill into controls
          and evidence.
        </p>
      </div>

      {/* Browser chrome */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden max-w-5xl mx-auto">
        {/* Title bar */}
        <div className="bg-zinc-800 h-10 flex items-center px-4 gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="ml-4 bg-zinc-900 rounded px-3 py-1 text-xs font-mono text-zinc-500 flex-1 max-w-xs">
            compass.internal/dashboard
          </span>
        </div>

        {/* Mockup content */}
        <div className="bg-zinc-950 p-6 md:p-8">
          <div className="mb-6">
            <p className="text-xl font-bold text-zinc-50">Control Room</p>
            <p className="text-sm text-zinc-500 mt-0.5">AI Governance Portfolio</p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {STATS.map((label) => (
              <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <p className="text-xs text-zinc-500 mb-2">{label}</p>
                <p className="text-2xl font-bold text-zinc-50">0</p>
              </div>
            ))}
          </div>

          {/* Framework compliance */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold text-zinc-50 mb-4">Framework Compliance</p>
            <div className="space-y-4">
              {FRAMEWORKS.map((fw) => (
                <div key={fw}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-zinc-400">{fw}</span>
                    <span className="text-zinc-600">No submitted assessments</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5" />
                </div>
              ))}
            </div>
          </div>

          {/* AI Systems table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <p className="text-sm font-semibold text-zinc-50 mb-4">AI Systems Portfolio</p>
            <div className="grid grid-cols-4 gap-4 text-xs text-zinc-600 border-b border-zinc-800 pb-2 mb-3">
              <span>System</span><span>Business Unit</span><span>Risk Tier</span><span>Status</span>
            </div>
            <p className="text-xs text-zinc-600">No systems registered yet.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
