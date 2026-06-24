import { render, screen } from "@/test-utils";
import { describe, expect, it } from "vitest";
import { AppInput } from "./app-input";

describe("AppInput", () => {
  describe("without label or error", () => {
    it("renders a plain input with no wrapper", () => {
      const { container } = render(<AppInput id="name" placeholder="Name" />);
      expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
      expect(container.querySelector("div")).toBeNull();
    });
  });

  describe("label", () => {
    it("renders a visible label when the label prop is provided", () => {
      render(<AppInput id="email" label="Email" />);
      expect(screen.getByText(/email/i)).toBeInTheDocument();
    });

    it("associates the label with the input via htmlFor", () => {
      render(<AppInput id="email" label="Email" />);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it("does not render a label element when label prop is omitted", () => {
      render(<AppInput id="email" error="Required" />);
      expect(screen.queryByRole("label")).toBeNull();
    });
  });

  describe("error", () => {
    it("renders the error message when error prop is provided", () => {
      render(<AppInput id="email" error="This field is required" />);
      expect(screen.getByText("This field is required")).toBeInTheDocument();
    });

    it("assigns the correct id to the error paragraph", () => {
      render(<AppInput id="email" error="Invalid email" />);
      expect(screen.getByText("Invalid email")).toHaveAttribute(
        "id",
        "email-error"
      );
    });

    it("sets aria-describedby on the input pointing to the error", () => {
      render(<AppInput id="email" error="Invalid email" />);
      expect(screen.getByRole("textbox")).toHaveAttribute(
        "aria-describedby",
        "email-error"
      );
    });

    it("sets aria-invalid on the input when error is present", () => {
      render(<AppInput id="email" error="Required" />);
      expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
    });

    it("does not render an error when error prop is omitted", () => {
      render(<AppInput id="email" label="Email" />);
      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("does not set aria-describedby when there is no error", () => {
      render(<AppInput id="email" label="Email" />);
      expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-describedby");
    });
  });

  describe("label and error together", () => {
    it("renders both label and error at the same time", () => {
      render(<AppInput id="email" label="Email" error="Required" />);
      expect(screen.getByText(/email/i)).toBeInTheDocument();
      expect(screen.getByText("Required")).toBeInTheDocument();
    });

    it("the label is associated with the input", () => {
      render(<AppInput id="email" label="Email" error="Required" />);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });
  });
});
