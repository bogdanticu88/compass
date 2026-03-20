const FRAMEWORKS = [
  {
    name: "EU AI Act",
    controls: "47 controls",
    description:
      "Risk classification, transparency obligations, and human oversight requirements for AI systems deployed in the EU.",
  },
  {
    name: "DORA",
    controls: "38 controls",
    description:
      "Digital operational resilience for financial entities — ICT risk management, incident reporting, and third-party oversight.",
  },
  {
    name: "ISO 42001",
    controls: "52 controls",
    description:
      "AI management system standard covering governance, risk management, and continual improvement of AI systems.",
  },
  {
    name: "NIST AI RMF",
    controls: "110 controls",
    description:
      "Govern, Map, Measure, and Manage functions for building trustworthy and responsible AI.",
  },
];

export function FrameworksSection() {
  return (
    <section id="frameworks" className="py-24 px-6 max-w-7xl mx-auto">
      <div className="mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-zinc-50">
          Four Frameworks. One Platform.
        </h2>
        <p className="mt-4 text-zinc-400 max-w-2xl">
          Assess your AI systems against every major regulatory and standards framework
          from a single platform.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FRAMEWORKS.map((fw) => (
          <div
            key={fw.name}
            className="bg-zinc-900 border border-zinc-800 border-l-4 border-l-blue-600 rounded-lg p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold text-zinc-50">{fw.name}</h3>
              <span className="font-mono text-xs text-zinc-500 shrink-0 mt-0.5">
                {fw.controls}
              </span>
            </div>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{fw.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
