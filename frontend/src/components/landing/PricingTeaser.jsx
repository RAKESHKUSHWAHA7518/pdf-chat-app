import { Check, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useInView } from "../../hooks/useInView";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { InteractiveCard } from "../ui/InteractiveCard";
import { cn } from "../../utils/cn";

const tiers = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    description: "Ideal for trying out vector search on personal PDFs.",
    features: [
      "Up to 3 PDF uploads per day",
      "Maximum 25 pages per document",
      "Fast Gemini streaming answers",
      "Page-level source citations",
      "7-day session history",
    ],
    cta: "Start Free",
    link: "/app",
    popular: false,
  },
  {
    name: "Pro Researcher",
    price: "$19",
    period: "per month",
    description: "For professionals, students, and active researchers.",
    features: [
      "Unlimited PDF uploads",
      "Up to 500 pages per document",
      "High-precision vector re-ranking",
      "Multi-document library storage",
      "Export summaries to Markdown/PDF",
      "Priority streaming queue",
    ],
    cta: "Upgrade to Pro",
    link: "/pricing",
    popular: true,
  },
  {
    name: "Team & Enterprise",
    price: "$49",
    period: "per seat/month",
    description: "Collaborative knowledge bases for teams and firms.",
    features: [
      "Shared organization document vault",
      "SOC 2 compliance documentation",
      "Custom chunking & embedding models",
      "Dedicated API access & webhook support",
      "99.9% uptime SLA",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
    link: "/pricing",
    popular: false,
  },
];

export function PricingTeaser() {
  const [ref, isInView] = useInView({ threshold: 0.1 });

  return (
    <section ref={ref} className="py-20 md:py-28 relative border-t border-slate-800/80 bg-slate-950/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className={cn("text-center max-w-2xl mx-auto mb-16 reveal-init", isInView && "reveal-visible")}>
          <Badge variant="gradient" className="mb-3">
            Transparent Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Simple plans for <span className="text-gradient">every workload</span>
          </h2>
          <p className="text-slate-400 text-base">
            Start for free today. Upgrade when you need unlimited pages and multi-document storage.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 items-stretch">
          {tiers.map((tier, idx) => (
            <div
              key={tier.name}
              className={cn("reveal-init", isInView && "reveal-visible", `stagger-${idx + 1}`)}
            >
              <InteractiveCard
                className={cn(
                  "h-full flex flex-col justify-between p-8 relative",
                  tier.popular && "border-indigo-500/80 shadow-2xl shadow-indigo-500/20 bg-slate-900/90"
                )}
              >
                {tier.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge variant="gradient" size="sm" className="px-3 py-1 shadow-md">
                      <Sparkles className="w-3 h-3 mr-1 text-amber-300" />
                      MOST POPULAR
                    </Badge>
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight mb-1">
                    {tier.name}
                  </h3>
                  <p className="text-xs text-slate-400 mb-6">{tier.description}</p>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-black text-white">{tier.price}</span>
                    <span className="text-xs text-slate-400">/{tier.period}</span>
                  </div>

                  <div className="space-y-3 pt-6 border-t border-slate-800">
                    {tier.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8 mt-auto">
                  <Link to={tier.link} className="block">
                    <Button
                      variant={tier.popular ? "primary" : "secondary"}
                      className="w-full justify-center"
                      size="md"
                    >
                      {tier.cta} <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </InteractiveCard>
            </div>
          ))}
        </div>

        {/* Footnote */}
        <p className="text-center text-xs text-slate-500 mt-10">
          Need pay-as-you-go credit packs instead of a monthly subscription?{" "}
          <Link to="/pricing" className="text-indigo-400 hover:underline">
            View Credit Packs →
          </Link>
        </p>

      </div>
    </section>
  );
}
