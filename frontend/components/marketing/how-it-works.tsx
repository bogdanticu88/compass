const STEPS = [
  {
    number: "01",
    title: "Register Your AI System",
    description:
      "Define your system name, business unit, and EU AI Act risk tier (unacceptable / high / limited / minimal).",
  },
  {
    number: "02",
    title: "Run an Assessment",
    description:
      "Select compliance frameworks and assign controls to your assessment team.",
  },
  {
    number: "03",
    title: "Review Findings",
    description:
      "Triage gaps, assign severity (critical / high / medium / low), and track remediation progress.",
  },
  {
    number: "04",
    title: "Collect Evidence",
    description:
      "Connect GitHub, Jira, Azure DevOps, and ServiceNow for automated evidence collection.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-zinc-900 border-y border-zinc-800">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-zinc-50 mb-16">
          From registration to audit-ready in four steps.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-0 relative">
          {/* Connecting line — desktop only */}
          <div className="hidden md:block absolute top-6 left-[12.5%] right-[12.5%] border-t border-zinc-700" />
          {STEPS.map((step) => (
            <div key={step.number} className="relative flex flex-col md:items-center md:text-center px-0 md:px-6">
              <span className="font-mono text-4xl font-bold text-zinc-700 relative bg-zinc-900 md:px-3">
                {step.number}
              </span>
              <h3 className="text-zinc-50 font-semibold mt-4 mb-2">{step.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
