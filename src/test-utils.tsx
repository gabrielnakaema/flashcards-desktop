import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, RenderOptions, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactElement } from "react";
import { expect } from "vitest";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

const AllProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = makeQueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };

export const selectComboboxOption = async (
  user: ReturnType<typeof userEvent.setup>,
  combobox: HTMLElement,
  optionName: string | RegExp
): Promise<void> => {
  await user.click(combobox);
  await user.click(await screen.findByRole("option", { name: optionName }));
  await waitFor(() => {
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
};
