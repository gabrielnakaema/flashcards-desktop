import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Header } from "@/components/shared/header";
import { useTheme } from "@/hooks/use-theme";

function RootLayout() {
  useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="p-6">
        <Outlet />
      </main>
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
