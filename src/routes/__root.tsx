import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Header } from "@/components/shared/header";
import { useTheme } from "@/hooks/use-theme";

function RootLayout() {
  useTheme();

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const isStudyRoute = /^\/decks\/[^/]+\/study\/?$/.test(pathname);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {!isStudyRoute && <Header />}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
