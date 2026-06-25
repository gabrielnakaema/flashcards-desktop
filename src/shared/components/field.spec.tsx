import { render, screen } from "@/test-utils";
import { describe, expect, it } from "vitest";
import { Field } from "./field";

describe("Field", () => {
  describe("label", () => {
    it("associates the label with the input via htmlFor", () => {
      render(
        <Field label="Email" htmlFor="email-input">
          <input id="email-input" />
        </Field>,
      );
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
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
  });
});
