import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Header } from "@/components/shared/header";
import { useTheme } from "@/hooks/use-theme";

function RootLayout() {
  useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
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
