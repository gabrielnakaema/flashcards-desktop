import { AppButton } from "@/shared/components/app-button";
import { cn } from "@/shared/lib/utils";
import type { Rating } from "@/features/cards";
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
      "border-red-500/40 text-red-300 hover:bg-red-500/10 hover:border-red-500/60",
    icon: RotateCcwIcon,
  },
  {
    value: "hard",
    label: "Hard",
    shortcut: "2",
    className:
      "border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/10 hover:border-yellow-500/60",
    icon: TrendingUpIcon,
  },
  {
    value: "good",
    label: "Medium",
    shortcut: "3",
    className:
      "border-blue-500/40 text-blue-300 hover:bg-blue-500/10 hover:border-blue-500/60",
    icon: ZapIcon,
  },
  {
    value: "easy",
    label: "Easy",
    shortcut: "4",
    className:
      "border-green-500/40 text-green-300 hover:bg-green-500/10 hover:border-green-500/60",
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
          <AppButton
            key={option.value}
            type="button"
            variant="secondary"
            size="lg"
            aria-keyshortcuts={option.shortcut}
            disabled={isSubmitting}
            style={{ "--study-stagger": index } as CSSProperties}
            className={cn(
              option.className,
              "study-enter transition duration-200 hover:-translate-y-0.5",
              isPending && "scale-[1.02] opacity-70"
            )}
            onClick={() => onRate(option.value)}
          >
            <Icon className="size-4" />
            {isPending ? "Saving..." : option.label}
          </AppButton>
        );
      })}
    </div>
  );
};
