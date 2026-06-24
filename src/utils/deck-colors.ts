export const deckColorClassnames = [
  "bg-orange-400",
  "bg-emerald-500",
  "bg-blue-500",
  "bg-red-400",
  "bg-yellow-400",
];

export const getDeckColor = (index: number): string =>
  deckColorClassnames[index % deckColorClassnames.length];
