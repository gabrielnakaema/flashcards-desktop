import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Rating } from "@/types/card";
import {
  RotateCcwIcon,
  SparklesIcon,
  TrendingUpIcon,
  ZapIcon,
} from "lucide-react";
import type { CSSProperties } from "react";

interface StudyRatingPanelProps {
  isSubmitting: boolean;
  pendingRating: Rating | null;
  onRate: (rating: Rating) => void;
}

const ratingOptions: Array<{
  value: Rating;
  label: string;
  shortcut: string;
  className: string;
  icon: typeof RotateCcwIcon;
}> = [
  {
    value: "again",
    label: "Again",
    shortcut: "1",
    className:
      "border-red-500/40 text-red-300 hover:bg-red-500/10 hover:shadow-red-500/10",
    icon: RotateCcwIcon,
  },
  {
    value: "hard",
    label: "Hard",
    shortcut: "2",
    className:
      "border-yellow-500/40 text-yellow-200 hover:bg-yellow-500/10 hover:shadow-yellow-500/10",
    icon: TrendingUpIcon,
  },
  {
    value: "good",
    label: "Medium",
    shortcut: "3",
    className:
      "border-blue-500/40 text-blue-200 hover:bg-blue-500/10 hover:shadow-blue-500/10",
    icon: ZapIcon,
  },
  {
    value: "easy",
    label: "Easy",
    shortcut: "4",
    className:
      "border-green-500/40 text-green-200 hover:bg-green-500/10 hover:shadow-green-500/10",
    icon: SparklesIcon,
  },
];

export const StudyRatingPanel = ({
  isSubmitting,
  pendingRating,
  onRate,
}: StudyRatingPanelProps) => {
  return (
    <div className="grid w-full grid-cols-2 gap-2 md:grid-cols-4">
      {ratingOptions.map((option, index) => {
        const Icon = option.icon;
        const isPending = pendingRating === option.value;

        return (
          <Button
            key={option.value}
            type="button"
            variant="outline"
            size="lg"
            aria-keyshortcuts={option.shortcut}
            disabled={isSubmitting}
            style={{ "--study-stagger": index } as CSSProperties}
            className={cn(
              option.className,
              "study-enter transition duration-200 hover:-translate-y-0.5 hover:shadow-lg",
              isPending && "scale-[1.02] bg-muted/60"
            )}
            onClick={() => onRate(option.value)}
          >
            <Icon className="size-4" />
            {isPending ? "Saving..." : option.label}
          </Button>
        );
      })}
    </div>
  );
};
