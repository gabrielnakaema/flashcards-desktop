import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test-utils";
import { Select } from "./select";

const defaultOptions = [
  { label: "Plain (front/back)", value: "plain" },
  { label: "Multiple choice", value: "multiple_choice" },
  { label: "Typed answer", value: "typed_answer" },
];

function setup(props: Partial<Parameters<typeof Select>[0]> = {}) {
  const user = userEvent.setup();
  const onChange = props.onChange ?? vi.fn();

  render(
    <Select value="" onChange={onChange} options={defaultOptions} {...props} />
  );

  return { user, onChange };
}

describe("Select", () => {
  describe("rendering", () => {
    it("renders the placeholder when value is empty", () => {
      setup({ placeholder: "Pick a type" });
      expect(screen.getByText("Pick a type")).toBeInTheDocument();
    });

    it("renders the default placeholder when none is provided and value is empty", () => {
      setup();
      expect(screen.getByText(/select an option/i)).toBeInTheDocument();
    });
  });

  describe("options", () => {
    it("shows all option labels when the trigger is clicked", async () => {
      const { user } = setup({ value: "plain" });

      await user.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(
          screen.getAllByText("Plain (front/back)").length
        ).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("Multiple choice")).toBeInTheDocument();
        expect(screen.getByText("Typed answer")).toBeInTheDocument();
      });
    });
  });

  describe("onChange", () => {
    it("calls onChange with the selected value when an option is clicked", async () => {
      const onChange = vi.fn();
      const { user } = setup({ onChange, value: "plain" });

      await user.click(screen.getByRole("combobox"));
      await user.click(await screen.findByText("Multiple choice"));

      expect(onChange).toHaveBeenCalledWith("multiple_choice");
    });
  });

  describe("disabled", () => {
    it("renders the trigger as disabled when disabled prop is true", () => {
      setup({ disabled: true, value: "plain" });
      expect(screen.getByRole("combobox")).toBeDisabled();
    });

    it("does not open the listbox when disabled", async () => {
      const { user } = setup({ disabled: true, value: "plain" });

      await user.click(screen.getByRole("combobox"));

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });
});
