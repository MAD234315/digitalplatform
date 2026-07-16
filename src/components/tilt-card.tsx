import { useRef, type ReactNode, type CSSProperties } from "react";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  /** Max rotation in degrees on each axis. */
  max?: number;
  /** Optional inline style passthrough. */
  style?: CSSProperties;
};

/**
 * Subtle 3D tilt that follows the cursor. Pointer-driven with rAF, GPU-only
 * transforms, and full reset on leave. Skipped when the user prefers reduced
 * motion or the device is coarse-pointer (touch), where hover-tilt makes no
 * sense and would fight scroll gestures.
 */
export function TiltCard({ children, className = "", max = 6, style }: TiltCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const raf = useRef<number | null>(null);

  const isEnabled = () => {
    if (typeof window === "undefined") return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    if (window.matchMedia("(hover: none)").matches) return false;
    return true;
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isEnabled()) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 .. 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translate3d(0,-2px,0)`;
    });
  };

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    if (raf.current) cancelAnimationFrame(raf.current);
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translate3d(0,0,0)";
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      onPointerCancel={reset}
      className={className}
      style={{
        transition: "transform 350ms cubic-bezier(0.2,0.7,0.2,1)",
        willChange: "transform",
        transformStyle: "preserve-3d",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
