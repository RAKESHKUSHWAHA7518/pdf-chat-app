import { Star } from "lucide-react";
import { useInView } from "../../hooks/useInView";
import { InteractiveCard } from "../ui/InteractiveCard";
import { Badge } from "../ui/Badge";
import { cn } from "../../utils/cn";

const testimonials = [
  {
    quote: "PDFChat cut our legal contract review time by over 65%. The citations feature makes verification foolproof because we can jump directly to clause paragraphs.",
    name: "Elena Rostova",
    role: "Senior Legal Counsel",
    company: "Apex Legal Partners",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  },
  {
    quote: "Analyzing 120-page clinical trial reports used to take my research group days. Now we extract statistical tables and drug efficacy data in minutes.",
    name: "Dr. Marcus Vance",
    role: "Biomedical Researcher",
    company: "Stanford Medical Research",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    quote: "The sub-second streaming answers and multi-session library allow me to cross-reference multiple quarterly earnings reports without reloading files.",
    name: "David Chen",
    role: "Equity Research Analyst",
    company: "Horizon Capital",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
];

export function Testimonials() {
  const [ref, isInView] = useInView({ threshold: 0.15 });

  return (
    <section ref={ref} className="py-20 md:py-28 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className={cn("text-center max-w-2xl mx-auto mb-16 reveal-init", isInView && "reveal-visible")}>
          <Badge variant="gradient" className="mb-3">
            Trusted by Professionals
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Loved by researchers, analysts, and students
          </h2>
          <p className="text-slate-400 text-base">
            Over 50,000+ documents processed this month across legal, medical, and financial domains.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={t.name}
              className={cn("reveal-init", isInView && "reveal-visible", `stagger-${idx + 1}`)}
            >
              <InteractiveCard className="h-full flex flex-col justify-between p-6">
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed italic mb-6">
                    "{t.quote}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-700"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">
                      {t.name}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {t.role} · <span className="text-indigo-400">{t.company}</span>
                    </p>
                  </div>
                </div>
              </InteractiveCard>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
