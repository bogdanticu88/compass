import {
  LayoutDashboard,
  Users,
  Link2,
  ClipboardList,
  FileBarChart,
  Server,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: LayoutDashboard,
    title: "Multi-Framework Coverage",
    description:
      "Assess against EU AI Act, DORA, ISO 42001, and NIST AI RMF simultaneously from one platform.",
  },
  {
    icon: Users,
    title: "Role-Based Dashboards",
    description:
      "Executive control room and assessor workbench — purpose-built for each team's workflow.",
  },
  {
    icon: Link2,
    title: "Automated Evidence",
    description:
      "Pull evidence automatically from GitHub, Jira, Azure DevOps, and ServiceNow.",
  },
  {
    icon: ClipboardList,
    title: "Full Audit Trail",
    description:
      "Complete history of every control assessment, status change, and evidence submission.",
  },
  {
    icon: FileBarChart,
    title: "Compliance Reports",
    description:
      "Generate audit-ready reports per framework at any point in time.",
  },
  {
    icon: Server,
    title: "Self-Hosted & Open Source",
    description:
      "Deploy on your own infrastructure. Full data sovereignty. MIT licensed.",
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-zinc-50 mb-12">
        Everything compliance teams need.
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-600 transition-colors duration-200"
          >
            <f.icon className="w-5 h-5 text-blue-600 mb-3" />
            <h3 className="text-zinc-50 font-semibold mb-1">{f.title}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
