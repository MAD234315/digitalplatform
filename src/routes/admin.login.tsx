import { createFileRoute } from "@tanstack/react-router";
import { AdminLoginPage } from "@/components/admin/AdminLoginPage";

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Login — Digital Platform" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLoginPage,
});