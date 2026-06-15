import { render, screen } from "@/test-utils";
import { describe, expect, it } from "vitest";
import { DeckCardMasteryProgress } from "./deck-card-mastery-progress";

describe("DeckCardMasteryProgress", () => {
  it("renders an accessible progress bar for the mastery percentage", () => {
    render(<DeckCardMasteryProgress percentage={50} />);

    const masteryProgress = screen.getByRole("progressbar");

    expect(masteryProgress).toHaveAttribute("aria-valuenow", "50");
    expect(masteryProgress).toHaveAttribute("aria-valuemin", "0");
    expect(masteryProgress).toHaveAttribute("aria-valuemax", "100");
    expect(masteryProgress).toHaveAttribute("aria-valuetext", "50% mastery");
    expect(masteryProgress).toHaveAccessibleName("Mastery");
  });

  it("formats the mastery percentage to 1 decimal place", () => {
    render(<DeckCardMasteryProgress percentage={50.33333} />);
    const masteryPercentage = screen.getByText("50.3%");
    expect(masteryPercentage).toBeInTheDocument();
  });

  it("clamps the mastery percentage to 100 if it is greater than 100", () => {
    render(<DeckCardMasteryProgress percentage={150} />);
    const masteryProgress = screen.getByRole("progressbar");
    expect(masteryProgress).toHaveAttribute("aria-valuenow", "100");
    expect(masteryProgress).toHaveAttribute("aria-valuemin", "0");
    expect(masteryProgress).toHaveAttribute("aria-valuemax", "100");
    expect(masteryProgress).toHaveAttribute("aria-valuetext", "100% mastery");
    expect(masteryProgress).toHaveAccessibleName("Mastery");
  });

  it("clamps the mastery percentage to 0 if it is less than 0", () => {
    render(<DeckCardMasteryProgress percentage={-10} />);
    const masteryProgress = screen.getByRole("progressbar");
    expect(masteryProgress).toHaveAttribute("aria-valuenow", "0");
    expect(masteryProgress).toHaveAttribute("aria-valuemin", "0");
    expect(masteryProgress).toHaveAttribute("aria-valuemax", "100");
    expect(masteryProgress).toHaveAttribute("aria-valuetext", "0% mastery");
    expect(masteryProgress).toHaveAccessibleName("Mastery");
  });
});
