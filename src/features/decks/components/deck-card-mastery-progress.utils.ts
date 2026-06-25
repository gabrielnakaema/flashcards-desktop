export const formatPercentage = (percentage: number): string => {
  return Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(percentage / 100);
};

export const differenceInDays = (now: Date, date: Date): number => {
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const formatLastReviewedAt = (
  lastReviewedAt: string | null,
  now = new Date()
): string | null => {
  if (!lastReviewedAt) return null;
  const diffInDays = differenceInDays(now, new Date(lastReviewedAt));
  if (diffInDays <= 1) return "Today";
  if (diffInDays <= 2) return "Yesterday";
  return diffInDays.toFixed(0) + " days ago";
};
