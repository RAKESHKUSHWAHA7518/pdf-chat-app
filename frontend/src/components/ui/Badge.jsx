import { cn } from "../../utils/cn";

export function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
  dot = false,
  ...props
}) {
  const sizeStyles = {
    sm: "text-[10px] px-2 py-0.5 rounded-full gap-1",
    md: "text-xs px-2.5 py-1 rounded-full gap-1.5",
    lg: "text-sm px-3.5 py-1.5 rounded-full gap-2",
  };

  const variantStyles = {
    default:
      "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30",
    gradient:
      "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-200 border border-indigo-400/30 shadow-sm shadow-indigo-500/10",
    success:
      "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30",
    warning:
      "bg-amber-500/10 text-amber-300 border border-amber-500/30",
    secondary:
      "bg-slate-800 text-slate-300 border border-slate-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium leading-none select-none",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {children}
    </span>
  );
}
