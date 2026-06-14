import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test-utils";
import { CreatableSelect } from "./creatable-select";

const SCIENCE = { value: "cat-1", label: "Science" };
const MATH = { value: "cat-2", label: "Math" };

const defaultProps = {
  options: [SCIENCE, MATH],
  value: "",
  onChange: vi.fn(),
  onCreate: vi.fn().mockResolvedValue(undefined),
  placeholder: undefined as string | undefined,
};

function setup(
  props: Partial<typeof defaultProps> & { emptyMessage?: string } = {}
) {
  const user = userEvent.setup();
  render(<CreatableSelect {...defaultProps} {...props} />);
  return { user };
}

describe("CreatableSelect", () => {
  describe("closed state", () => {
    it("renders a combobox button", () => {
      setup();
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("shows the placeholder text when no value is selected", () => {
      setup({
        placeholder: "Search",
      });
      expect(screen.getByRole("combobox")).toHaveTextContent(/search/i);
    });

    it("shows the selected option label instead of the placeholder", () => {
      setup({ value: SCIENCE.value });
      expect(screen.getByRole("combobox")).toHaveTextContent("Science");
    });

    it("uses a custom placeholder when provided", () => {
      setup({ placeholder: "Pick a category" });
      expect(screen.getByRole("combobox")).toHaveTextContent("Pick a category");
    });
  });

  describe("open state", () => {
    it("reveals the search input when the trigger is clicked", async () => {
      const { user } = setup();
      await user.click(screen.getByRole("combobox"));
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it("lists all provided options", async () => {
      const { user } = setup();
      await user.click(screen.getByRole("combobox"));
      expect(screen.getByText("Science")).toBeInTheDocument();
      expect(screen.getByText("Math")).toBeInTheDocument();
    });

    it("shows the empty message when there are no options", async () => {
      const { user } = setup({ options: [] });
      await user.click(screen.getByRole("combobox"));
      expect(screen.getByText(/no options found/i)).toBeInTheDocument();
    });

    it("shows a custom empty message when provided", async () => {
      const { user } = setup({
        options: [],
        emptyMessage: "No categories yet. Create one!",
      });
      await user.click(screen.getByRole("combobox"));
      expect(
        screen.getByText("No categories yet. Create one!")
      ).toBeInTheDocument();
    });
  });

  describe("option selection", () => {
    it("calls onChange with the option value when an option is clicked", async () => {
      const onChange = vi.fn();
      const { user } = setup({ onChange });
      await user.click(screen.getByRole("combobox"));
      await user.click(screen.getByText("Science"));
      expect(onChange).toHaveBeenCalledWith(SCIENCE.value);
    });

    it("closes the popover after selecting an option", async () => {
      const { user } = setup();
      await user.click(screen.getByRole("combobox"));
      await user.click(screen.getByText("Science"));
      expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
    });
  });

  describe("create option", () => {
    it("shows a Create option when the query does not match any option", async () => {
      const { user } = setup();
      await user.click(screen.getByRole("combobox"));
      await user.type(screen.getByPlaceholderText(/search/i), "Physics");
      expect(screen.getByText(/create "physics"/i)).toBeInTheDocument();
    });

    it("hides the Create option when the query exactly matches an existing option", async () => {
      const { user } = setup();
      await user.click(screen.getByRole("combobox"));
      await user.type(screen.getByPlaceholderText(/search/i), "Science");
      expect(screen.queryByText(/create "science"/i)).not.toBeInTheDocument();
    });

    it("calls onCreate with the typed query when Create is clicked", async () => {
      const onCreate = vi.fn().mockResolvedValue(undefined);
      const { user } = setup({ onCreate });
      await user.click(screen.getByRole("combobox"));
      await user.type(screen.getByPlaceholderText(/search/i), "Physics");
      await user.click(screen.getByText(/create "physics"/i));
      expect(onCreate).toHaveBeenCalledWith("Physics");
    });

    it("is case-insensitive when checking for an exact match", async () => {
      const { user } = setup();
      await user.click(screen.getByRole("combobox"));
      await user.type(screen.getByPlaceholderText(/search/i), "science");
      expect(screen.queryByText(/create "science"/i)).not.toBeInTheDocument();
    });

    it("does not show the Create option when the query is empty", async () => {
      const { user } = setup();
      await user.click(screen.getByRole("combobox"));
      expect(screen.queryByText(/^create "/i)).not.toBeInTheDocument();
    });
  });
});
