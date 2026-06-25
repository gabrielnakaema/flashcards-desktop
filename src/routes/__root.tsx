import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Sidebar } from "@/shared/layout/sidebar";
import { useTheme } from "@/shared/hooks/use-theme";

function RootLayout() {
  useTheme();

  return (
    <div className="h-screen bg-zinc-950 text-foreground flex overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">
        <Outlet />
      </main>
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
