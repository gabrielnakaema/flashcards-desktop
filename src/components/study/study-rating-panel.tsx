import { Button } from "@/components/ui/button";
import type { Rating } from "@/types/card";

interface StudyRatingPanelProps {
  isSubmitting: boolean;
  pendingRating: Rating | null;
  onRate: (rating: Rating) => void;
}

const ratingOptions: Array<{
  value: Rating;
  label: string;
  className: string;
}> = [
  {
    value: "again",
    label: "Again",
    className: "border-red-500/40 text-red-300 hover:bg-red-500/10",
  },
  {
    value: "hard",
    label: "Hard",
    className: "border-yellow-500/40 text-yellow-200 hover:bg-yellow-500/10",
  },
  {
    value: "good",
    label: "Medium",
    className: "border-blue-500/40 text-blue-200 hover:bg-blue-500/10",
  },
  {
    value: "easy",
    label: "Easy",
    className: "border-green-500/40 text-green-200 hover:bg-green-500/10",
  },
];

export const StudyRatingPanel = ({
  isSubmitting,
  pendingRating,
  onRate,
}: StudyRatingPanelProps) => {
  return (
    <div className="grid w-full grid-cols-2 gap-2 md:grid-cols-4">
      {ratingOptions.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant="outline"
          size="lg"
          disabled={isSubmitting}
          className={option.className}
          onClick={() => onRate(option.value)}
        >
          {pendingRating === option.value ? "Saving..." : option.label}
        </Button>
      ))}
    </div>
  );
};
