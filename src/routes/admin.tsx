import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [
    { title: "Administrator Console — Digital Platform" },
    { name: "description", content: "Digital Platform administrator tools and settings." },
    { property: "og:title", content: "Administrator Console — Digital Platform" },
    { property: "og:description", content: "Digital Platform administrator tools and settings." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: () => <Outlet />,
});