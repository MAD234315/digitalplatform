import type { ElementType, ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
  y?: number;
  once?: boolean;
};

/**
 * Reveal is intentionally a no-op wrapper: scroll-triggered animations have
 * been removed project-wide. Kept as a component so call sites don't need to
 * change. Renders children immediately in their final state.
 */
export function Reveal({ children, as: Tag = "div", className = "" }: RevealProps) {
  return <Tag className={className}>{children}</Tag>;
}
