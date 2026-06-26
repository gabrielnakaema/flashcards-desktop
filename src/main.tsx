import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { initDb } from "@/data/implementations/sqlite/db";
import { routeTree } from "./routeTree.gen";
import "./index.css";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { SettingsProvider } from "@/features/settings";
import { toast } from "sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (error: unknown) => {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          console.error(error);
          toast.error("An unknown error occurred");
        }
      },
    },
  },
});

const router = createRouter({ routeTree, defaultViewTransition: true });

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
