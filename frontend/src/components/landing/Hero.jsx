import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Shield, Zap, FileText, CheckCircle2, MessageSquare, Bot } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { InteractiveCard } from "../ui/InteractiveCard";

export function Hero() {
  return (
    <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline & Call To Action */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-block animate-fade-in-down">
              <Badge variant="gradient" size="md" dot className="px-3.5 py-1.5 shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 mr-1" />
                Gemini 2.5 + MongoDB Atlas Vector Search
              </Badge>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] animate-fade-in-up stagger-1">
              Chat with any PDF.{" "}
              <span className="text-gradient">
                Extract answers in seconds.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed animate-fade-in-up stagger-2">
              Turn long research papers, legal contracts, financial filings, and technical manuals into instant conversational insights. Get exact citations back to the source page.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2 animate-fade-in-up stagger-3">
              <Link to="/app" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto shadow-xl shadow-indigo-500/25">
                  Try It Free — No Card Needed
                  <ArrowRight className="w-5 h-5 ml-1.5" />
                </Button>
              </Link>
              <Link to="/pricing" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  View Pricing & Credits
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 animate-fade-in-up stagger-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-slate-400">100% Private & Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs text-slate-400">Sub-second Streaming</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-xs text-slate-400">Page-level Citations</span>
              </div>
            </div>
          </div>

          {/* Right Column: Floating Interactive Mockup */}
          <div className="lg:col-span-5 relative flex justify-center animate-scale-in">
            {/* Ambient Backlight */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-xl opacity-75 animate-pulse-glow" />

            <div className="relative w-full max-w-md animate-float">
              <InteractiveCard className="p-0 border-slate-700/80 bg-slate-900/90 shadow-2xl">
                {/* Mockup Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60 rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    <span className="ml-2 text-xs font-mono text-slate-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      Q3_Financial_Report.pdf (48 pages)
                    </span>
                  </div>
                  <Badge variant="success" size="sm">Active</Badge>
                </div>

                {/* Simulated Chat Dialogue */}
                <div className="p-4 space-y-3.5 text-xs">
                  {/* User query */}
                  <div className="flex items-start justify-end gap-2">
                    <div className="bg-indigo-600/90 text-white rounded-2xl rounded-tr-sm px-3.5 py-2.5 max-w-[85%] shadow-md">
                      What was the net revenue growth in Q3 compared to last year?
                    </div>
                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-slate-300 font-bold shrink-0">
                      You
                    </div>
                  </div>

                  {/* AI Response with Citation */}
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-slate-800/90 border border-slate-700/60 text-slate-200 rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[88%] space-y-2">
                      <p>
                        Net revenue in Q3 reached <strong>$142.8 million</strong>, representing a <strong className="text-emerald-400">+28.4% YoY increase</strong>, driven primarily by enterprise cloud adoption.
                      </p>
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-700/50">
                        <span className="text-[10px] text-slate-400">Sources:</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] border border-indigo-500/30">
                          Page 14, Table 3.2
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] border border-indigo-500/30">
                          Page 22
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Simulated Input Bar */}
                  <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[11px] text-slate-500">Ask about risks, forecasts, or summaries...</span>
                  </div>
                </div>
              </InteractiveCard>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
