import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test-utils";
import { AppSelect } from "./app-select";

const defaultOptions = [
  { label: "Easy", value: "easy" },
  { label: "Medium", value: "medium" },
  { label: "Hard", value: "hard" },
];

function setup(props: Partial<Parameters<typeof AppSelect>[0]> = {}) {
  const user = userEvent.setup();
  const onChange = props.onChange ?? vi.fn();

  render(
    <AppSelect
      value=""
      onChange={onChange}
      options={defaultOptions}
      {...props}
    />
  );

  return { user, onChange };
}

describe("AppSelect", () => {
  describe("without label or error", () => {
    it("renders the combobox with no label or error", () => {
      setup();
      expect(screen.getByRole("combobox")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).toBeNull();
      expect(screen.queryByText(/label/i)).toBeNull();
    });
  });

  describe("label", () => {
    it("renders a visible label when the label prop is provided", () => {
      setup({ id: "difficulty", label: "Difficulty" });
      expect(screen.getByText(/difficulty/i)).toBeInTheDocument();
    });

    it("associates the label with the combobox via htmlFor", () => {
      setup({ id: "difficulty", label: "Difficulty" });
      expect(screen.getByLabelText(/difficulty/i)).toBeInTheDocument();
    });

    it("does not render a label element when label prop is omitted", () => {
      setup({ id: "difficulty" });
      expect(screen.queryByRole("label")).toBeNull();
    });
  });

  describe("error", () => {
    it("renders the error message when error prop is provided", () => {
      setup({ id: "difficulty", error: "Please select a difficulty" });
      expect(
        screen.getByText("Please select a difficulty")
      ).toBeInTheDocument();
    });

    it("assigns the correct id to the error paragraph", () => {
      setup({ id: "difficulty", error: "Required" });
      expect(screen.getByText("Required")).toHaveAttribute(
        "id",
        "difficulty-error"
      );
    });

    it("sets aria-describedby on the combobox pointing to the error", () => {
      setup({ id: "difficulty", error: "Required" });
      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-describedby",
        "difficulty-error"
      );
    });

    it("sets aria-invalid on the combobox when error is present", () => {
      setup({ id: "difficulty", error: "Required" });
      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-invalid",
        "true"
      );
    });

    it("does not render an error when error prop is omitted", () => {
      setup({ id: "difficulty", label: "Difficulty" });
      expect(screen.queryByRole("alert")).toBeNull();
    });
  });

  describe("label and error together", () => {
    it("renders both label and error at the same time", () => {
      setup({ id: "difficulty", label: "Difficulty", error: "Required" });
      expect(screen.getByText(/difficulty/i)).toBeInTheDocument();
      expect(screen.getByText("Required")).toBeInTheDocument();
    });
  });

  describe("options", () => {
    it("shows all option labels when the trigger is clicked", async () => {
      const { user } = setup({ id: "difficulty", value: "easy" });

      await user.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(
          screen.getAllByText("Easy").length
        ).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("Medium")).toBeInTheDocument();
        expect(screen.getByText("Hard")).toBeInTheDocument();
      });
    });

    it("calls onChange with the selected value when an option is clicked", async () => {
      const onChange = vi.fn();
      const { user } = setup({ id: "difficulty", onChange, value: "easy" });

      await user.click(screen.getByRole("combobox"));
      await user.click(await screen.findByText("Medium"));

      expect(onChange).toHaveBeenCalledWith("medium");
    });
  });
});
