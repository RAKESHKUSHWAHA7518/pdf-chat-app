import { Hero, Features, HowItWorks, Testimonials, PricingTeaser } from "../components/landing";

export function LandingPage() {
  return (
    <div className="w-full">
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <PricingTeaser />
    </div>
  );
}
