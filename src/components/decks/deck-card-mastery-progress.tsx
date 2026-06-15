import { cn } from "@/lib/utils";
import { useId } from "react";

interface DeckCardMasteryProgressProps {
  percentage: number;
}

const formatPercentage = (percentage: number) => {
  const formatted = Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(percentage / 100);
  return formatted;
};

export const DeckCardMasteryProgress = ({
  percentage,
}: DeckCardMasteryProgressProps) => {
  const labelId = useId();
  const value = Math.min(100, Math.max(0, percentage));
  const formattedPercentage = formatPercentage(value);

  const percentColor = value > 0 ? "text-green-600" : "text-muted-foreground";

  return (
    <div className="w-full flex flex-col gap-1">
      <div className="flex items-center justify-between w-full">
        <p className="text-sm text-muted-foreground" id={labelId}>
          Mastery
        </p>
        <p className={cn("text-xs font-bold", percentColor)}>
          {formattedPercentage}
        </p>
      </div>
      <div
        className="w-full h-2 bg-foreground/20 rounded-full relative overflow-hidden"
        role="progressbar"
        aria-labelledby={labelId}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${formattedPercentage} mastery`}
      >
        <div
          className="absolute top-0 left-0 h-full bg-[linear-gradient(to_right,var(--color-green-700),var(--color-green-600))] rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
