import type { ErrorRouteComponent, ErrorComponentProps } from "@tanstack/react-router";

function D(props: ErrorComponentProps) {
  const msg = props.error?.message;
  return <div>{msg}{String(props.reset)}</div>;
}
const Dc: ErrorRouteComponent = D;

function E({ error, reset }: ErrorComponentProps) {
  return <div>{error.message}{String(reset)}</div>;
}
const Ec: ErrorRouteComponent = E;

export { Dc, Ec };
