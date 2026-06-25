import { cn } from "@/shared/lib/utils";
import {
  formatLastReviewedAt,
  formatPercentage,
} from "./deck-card-mastery-progress.utils";

interface DeckCardMasteryProgressProps {
  percentage: number;
  lastReviewedAt: string | null;
  backgroundColor: string;
}

export const DeckCardMasteryProgress = ({
  percentage,
  lastReviewedAt,
  backgroundColor,
}: DeckCardMasteryProgressProps) => {
  const value = Math.min(100, Math.max(0, percentage));
  const formattedPercentage = formatPercentage(value);

  return (
    <div className="w-full flex flex-col gap-1">
      <div
        className="w-full h-1 bg-foreground/20 rounded-[1px] relative overflow-hidden"
        role="progressbar"
        aria-label="Mastery"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${formattedPercentage} mastery`}
      >
        <div
          className={cn(
            "absolute top-0 left-0 h-full rounded-[1px]",
            backgroundColor
          )}
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="flex items-center justify-between w-full">
        <p className="text-[10px] font-normal text-muted-foreground font-mono tracking-wider">
          {formattedPercentage}
          &nbsp;mastery
        </p>
        <p className="text-[10px] font-normal text-muted-foreground tracking-tight font-mono">
          {formatLastReviewedAt(lastReviewedAt)}
        </p>
      </div>
    </div>
  );
};
