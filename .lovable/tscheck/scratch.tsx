import type { ErrorRouteComponent, ErrorComponentProps } from "@tanstack/react-router";

function Plain({ error, reset }: { error: Error; reset: () => void }) {
  return <div>{error.message}{String(reset)}</div>;
}

const A: ErrorRouteComponent = Plain;

const WithPreload = Object.assign(Plain, { preload: async () => {} });
const B: ErrorRouteComponent = WithPreload;

function Typed(props: ErrorComponentProps) {
  return <div>{String(props.error)}{String(props.reset)}</div>;
}
const C: ErrorRouteComponent = Typed;

export { A, B, C };
