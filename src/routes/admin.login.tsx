import { createFileRoute } from "@tanstack/react-router";
import { AdminLoginPage } from "@/components/admin/AdminLoginPage";

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Login — Digital Platform" },
      { name: "description", content: "Sign into the Digital Platform administrator console." },
      { property: "og:title", content: "Admin Login — Digital Platform" },
      { property: "og:description", content: "Sign into the Digital Platform administrator console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLoginPage,
});