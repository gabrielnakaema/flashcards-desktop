import { render, screen } from "@/test-utils";
import userEvent from "@testing-library/user-event";
import { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./confirm-dialog";

const setup = (props: ComponentProps<typeof ConfirmDialog>) => {
  const user = userEvent.setup();

  render(<ConfirmDialog {...props} />);

  return { user };
};

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  title: "Title",
  description: "Description",
  onConfirm: vi.fn(),
  confirmLabel: "Confirm",
  cancelLabel: "Cancel",
  pendingLabel: "Pending",
};

describe("ConfirmDialog", () => {
  it("should render", () => {
    setup({
      ...defaultProps,
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
  });

  it("should call onOpenChange when the cancel button is clicked", async () => {
    const onOpenChange = vi.fn();
    const { user } = setup({
      ...defaultProps,
      open: true,
      onOpenChange,
    });
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("should call onConfirm when the confirm button is clicked", async () => {
    const onConfirm = vi.fn();
    const { user } = setup({
      ...defaultProps,
      onConfirm,
    });
    await user.click(screen.getByRole("button", { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("should show error message when error is provided", () => {
    setup({
      ...defaultProps,
      error: "Error",
    });
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  it("should show pending label when isPending is true", () => {
    setup({
      ...defaultProps,
      isPending: true,
      pendingLabel: "Pending",
    });
    expect(
      screen.getByRole("button", { name: /pending/i })
    ).toBeInTheDocument();
  });

  it("should disable buttons when isPending is true", () => {
    setup({
      ...defaultProps,
      isPending: true,
      confirmLabel: "Confirm",
      cancelLabel: "Cancel",
      pendingLabel: "Pending",
    });
    expect(screen.getByRole("button", { name: /pending/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
  });
});
