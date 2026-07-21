import { createFileRoute } from "@tanstack/react-router";
import { AdminLoginPage } from "@/components/admin/AdminLoginPage";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Digital Platform Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

