import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/suporte")({
  component: SuporteLayout,
});

function SuporteLayout() {
  return <Outlet />;
}
