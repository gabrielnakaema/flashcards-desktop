import { render, screen } from "@/test-utils";
import { describe, expect, it } from "vitest";
import { AppTextarea } from "./app-textarea";

describe("AppTextarea", () => {
  describe("without label or error", () => {
    it("renders a plain textarea with no wrapper", () => {
      const { container } = render(
        <AppTextarea id="notes" placeholder="Notes" />
      );
      expect(screen.getByPlaceholderText("Notes")).toBeInTheDocument();
      expect(container.querySelector("div")).toBeNull();
    });
  });

  describe("label", () => {
    it("renders a visible label when the label prop is provided", () => {
      render(<AppTextarea id="notes" label="Notes" />);
      expect(screen.getByText(/notes/i)).toBeInTheDocument();
    });

    it("associates the label with the textarea via htmlFor", () => {
      render(<AppTextarea id="notes" label="Notes" />);
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    });

    it("does not render a label element when label prop is omitted", () => {
      render(<AppTextarea id="notes" error="Required" />);
      expect(screen.queryByRole("label")).toBeNull();
    });
  });

  describe("error", () => {
    it("renders the error message when error prop is provided", () => {
      render(<AppTextarea id="notes" error="This field is required" />);
      expect(screen.getByText("This field is required")).toBeInTheDocument();
    });

    it("assigns the correct id to the error paragraph", () => {
      render(<AppTextarea id="notes" error="Too long" />);
      expect(screen.getByText("Too long")).toHaveAttribute(
        "id",
        "notes-error"
      );
    });

    it("sets aria-describedby on the textarea pointing to the error", () => {
      render(<AppTextarea id="notes" error="Too long" />);
      expect(screen.getByRole("textbox")).toHaveAttribute(
        "aria-describedby",
        "notes-error"
      );
    });

    it("sets aria-invalid on the textarea when error is present", () => {
      render(<AppTextarea id="notes" error="Required" />);
      expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
    });

    it("does not render an error when error prop is omitted", () => {
      render(<AppTextarea id="notes" label="Notes" />);
      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("does not set aria-describedby when there is no error", () => {
      render(<AppTextarea id="notes" label="Notes" />);
      expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-describedby");
    });
  });

  describe("label and error together", () => {
    it("renders both label and error at the same time", () => {
      render(<AppTextarea id="notes" label="Notes" error="Required" />);
      expect(screen.getByText(/notes/i)).toBeInTheDocument();
      expect(screen.getByText("Required")).toBeInTheDocument();
    });

    it("the label is associated with the textarea", () => {
      render(<AppTextarea id="notes" label="Notes" error="Required" />);
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    });
  });
});
