export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Top Left Blob */}
      <div className="animate-pulse-glow absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-indigo-600/15 blur-[120px]" />
      
      {/* Middle Right Blob */}
      <div className="animate-pulse-glow absolute top-1/4 -right-40 h-[600px] w-[600px] rounded-full bg-purple-600/15 blur-[140px] [animation-delay:3s]" />
      
      {/* Bottom Center Blob */}
      <div className="animate-pulse-glow absolute -bottom-40 left-1/3 h-[550px] w-[550px] rounded-full bg-cyan-600/10 blur-[130px] [animation-delay:6s]" />

      {/* Subtle Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
    </div>
  );
}
