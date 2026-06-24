import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Sidebar } from "@/components/shared/sidebar";
import { useTheme } from "@/hooks/use-theme";

function RootLayout() {
  useTheme();

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const isStudyRoute = /^\/decks\/[^/]+\/study\/?$/.test(pathname);

  if (isStudyRoute) {
    return (
      <div className="h-screen bg-zinc-950 text-foreground flex flex-col overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden">
          <Outlet />
        </main>
        <TanStackRouterDevtools position="bottom-right" />
      </div>
    );
  }

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
