import { Navbar } from "@/components/marketing/navbar";
import { Hero } from "@/components/marketing/hero";
import { MetricsStrip } from "@/components/marketing/metrics-strip";
import { FrameworksSection } from "@/components/marketing/frameworks-section";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { UIPreview } from "@/components/marketing/ui-preview";
import { FeaturesGrid } from "@/components/marketing/features-grid";
import { Testimonials } from "@/components/marketing/testimonials";
import { FinalCTA } from "@/components/marketing/final-cta";
import { Footer } from "@/components/marketing/footer";

export default function LandingPage() {
  return (
    <div className="bg-[#09090b] min-h-screen text-zinc-50 font-sans">
      <Navbar />
      <main>
        <Hero />
        <MetricsStrip />
        <FrameworksSection />
        <HowItWorks />
        <UIPreview />
        <FeaturesGrid />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
