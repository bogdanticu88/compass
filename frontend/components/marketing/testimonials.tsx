const TESTIMONIALS = [
  {
    quote:
      "Compass cut our EU AI Act gap analysis from weeks to days. The control mapping across all four frameworks is exceptional.",
    name: "Sarah Chen",
    title: "Chief AI Governance Officer",
  },
  {
    quote:
      "Finally a tool that speaks to both our legal team and our engineers. The automated evidence connectors alone saved us 40 hours per assessment.",
    name: "Marcus Webb",
    title: "CISO",
  },
  {
    quote:
      "Open source, self-hosted, and audit-ready out of the box. Exactly what we needed for our ISO 42001 certification.",
    name: "Priya Nair",
    title: "Head of AI Compliance",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 px-6 bg-zinc-900 border-y border-zinc-800">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-zinc-50 mb-12">
          Trusted by governance teams.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-zinc-950 border border-zinc-800 rounded-lg p-6"
            >
              <p className="text-blue-600 text-4xl leading-none mb-3 font-serif">&ldquo;</p>
              <p className="text-zinc-300 text-sm leading-relaxed mb-6">{t.quote}</p>
              <p className="text-zinc-50 font-semibold text-sm">{t.name}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{t.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
