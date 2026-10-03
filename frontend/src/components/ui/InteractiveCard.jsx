import { useRef } from "react";
import { cn } from "../../utils/cn";

export function InteractiveCard({
  children,
  className = "",
  spotlight = true,
  hover = true,
  onClick,
  ...props
}) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!spotlight || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className={cn(
        "interactive-card p-6",
        hover && "interactive-card-hover",
        onClick && "cursor-pointer",
        className
      )}
      {...props}
    >
      {/* Radial Spotlight Beam */}
      {spotlight && (
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(550px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(99, 102, 241, 0.16), transparent 45%)",
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
