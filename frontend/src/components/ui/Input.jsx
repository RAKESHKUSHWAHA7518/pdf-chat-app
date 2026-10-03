import { forwardRef } from "react";
import { cn } from "../../utils/cn";

export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    className = "",
    inputClassName = "",
    type = "text",
    id,
    ...props
  },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(
            "w-full rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 shadow-inner backdrop-blur-md transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500/80 focus:border-red-500 focus:ring-red-500/20 animate-shake",
            inputClassName
          )}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
          <span>⚠️</span> {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-400 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
});
