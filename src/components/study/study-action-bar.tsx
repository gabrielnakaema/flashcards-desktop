import { Button } from "@/components/ui/button";
import { FlagIcon, ImageIcon, PencilIcon, StarIcon } from "lucide-react";

const actions = [
  { label: "Report", icon: FlagIcon },
  { label: "Edit Card", icon: PencilIcon },
  { label: "Star", icon: StarIcon },
  { label: "Media", icon: ImageIcon },
] as const;

export const StudyActionBar = () => {
  return (
    <div
      aria-label="Unavailable study actions"
      className="mx-auto flex w-fit max-w-full items-center gap-1 rounded-full border border-border bg-muted/70 p-1"
    >
      {actions.map(({ label, icon: Icon }) => (
        <Button
          key={label}
          type="button"
          variant="ghost"
          size="sm"
          disabled
          title={`${label} is not available yet`}
          className="gap-2 px-3 text-xs"
        >
          <Icon className="size-4" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  );
};
