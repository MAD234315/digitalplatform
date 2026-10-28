import { createFileRoute } from "@tanstack/react-router";
import { AdminLoginPage } from "@/components/admin/AdminLoginPage";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Digital Platform Admin" },
      { name: "description", content: "Access your Digital Platform administrator account." },
      { property: "og:title", content: "Sign in — Digital Platform Admin" },
      { property: "og:description", content: "Access your Digital Platform administrator account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

