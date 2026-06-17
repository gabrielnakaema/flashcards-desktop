import { render, screen } from "@/test-utils";
import { describe, expect, it } from "vitest";
import { Field } from "./field";

describe("Field", () => {
  describe("label", () => {
    it("renders a label element when the label prop is provided", () => {
      render(<Field label="Email" htmlFor="email-input" />);
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Email").tagName).toBe("LABEL");
    });

    it("does not render a label element when label prop is omitted", () => {
      render(<Field />);
      expect(screen.queryByRole("label")).not.toBeInTheDocument();
    });

    it("associates the label with the input via htmlFor", () => {
      render(
        <Field label="Email" htmlFor="email-input">
          <input id="email-input" />
        </Field>
      );
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
    });
  });

  describe("children", () => {
    it("renders children inside the container", () => {
      render(
        <Field>
          <input data-testid="inner-input" />
        </Field>
      );
      expect(screen.getByTestId("inner-input")).toBeInTheDocument();
    });
  });

  describe("error", () => {
    it("renders an error paragraph with the correct id when error is provided", () => {
      render(<Field error="This field is required" htmlFor="my-field" />);
      const errorEl = screen.getByText("This field is required");
      expect(errorEl).toBeInTheDocument();
      expect(errorEl.tagName).toBe("P");
      expect(errorEl).toHaveAttribute("id", "my-field-error");
    });

    it("does not render an error paragraph when error is omitted", () => {
      render(<Field label="Name" htmlFor="name" />);
      expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
    });
  });
});
