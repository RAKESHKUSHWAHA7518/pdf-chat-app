import { UploadCloud, Network, MessagesSquare, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useInView } from "../../hooks/useInView";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { cn } from "../../utils/cn";

const steps = [
  {
    step: "01",
    title: "Upload your Document",
    description: "Drag & drop any PDF up to 50MB. Our engine parses raw text, multi-column layouts, and tables in seconds.",
    icon: UploadCloud,
    accent: "from-blue-500 to-indigo-500",
  },
  {
    step: "02",
    title: "Vector Pipeline Indexing",
    description: "The document is intelligently segmented into overlapping chunks, embedded into vector space, and indexed in Atlas.",
    icon: Network,
    accent: "from-indigo-500 to-purple-500",
  },
  {
    step: "03",
    title: "Chat & Verify Citations",
    description: "Ask questions naturally. The system retrieves relevant context, streams answers, and highlights source pages.",
    icon: MessagesSquare,
    accent: "from-purple-500 to-pink-500",
  },
];

export function HowItWorks() {
  const [ref, isInView] = useInView({ threshold: 0.15 });

  return (
    <section id="how-it-works" ref={ref} className="py-20 md:py-28 relative border-t border-slate-800/80 bg-slate-950/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className={cn("text-center max-w-3xl mx-auto mb-16 reveal-init", isInView && "reveal-visible")}>
          <Badge variant="gradient" className="mb-3">
            Simple 3-Step Process
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            From dense PDF to <span className="text-gradient">instant answers</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            No complex setup or model fine-tuning. Just upload your PDF and start asking questions.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className={cn(
                  "relative rounded-2xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur-xl transition-all duration-300 hover:border-slate-700 reveal-init",
                  isInView && "reveal-visible",
                  `stagger-${idx + 1}`
                )}
              >
                {/* Step number badge */}
                <div className="flex items-center justify-between mb-6">
                  <div className={cn(
                    "w-12 h-12 rounded-xl bg-gradient-to-tr flex items-center justify-center text-white shadow-md",
                    item.accent
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-3xl font-black font-mono text-slate-700 select-none">
                    {item.step}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Quick CTA */}
        <div className="mt-14 text-center">
          <Link to="/app">
            <Button size="lg" className="shadow-lg shadow-indigo-500/20">
              Try It in Your Browser Now <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}
