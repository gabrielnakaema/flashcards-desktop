import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { initDb } from "@/data/implementations/sqlite/db";
import { routeTree } from "./routeTree.gen";
import "./index.css";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { SettingsProvider } from "./components/settings/settings-context";

const queryClient = new QueryClient();

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");

const bootstrap = async (): Promise<void> => {
  if (!rootElement || rootElement.innerHTML) {
    return;
  }

  await initDb();

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
          <RouterProvider router={router} />
        </SettingsProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

void bootstrap();
