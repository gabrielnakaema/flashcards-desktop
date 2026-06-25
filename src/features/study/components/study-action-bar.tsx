import { Button } from "@/shared/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/shared/ui/popover";
import type { StudyShortcutItem } from "@/features/study/hooks/use-study-keyboard-shortcuts";
import { KeyboardIcon, PencilIcon } from "lucide-react";

const actions = [{ label: "Edit Card", icon: PencilIcon }] as const;

interface StudyActionBarProps {
  shortcutItems: StudyShortcutItem[];
}

export const StudyActionBar = ({ shortcutItems }: StudyActionBarProps) => {
  return (
    <div
      aria-label="Study actions"
      className="mx-auto flex w-fit max-w-full items-center gap-1 rounded-full border border-border bg-muted/70 p-1"
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2 px-3 text-xs"
            aria-label="Keyboard shortcuts"
          >
            <KeyboardIcon className="size-4" />
            <span className="hidden sm:inline">Keyboard shortcuts</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="center" side="top" className="w-80">
          <PopoverHeader>
            <PopoverTitle>Keyboard shortcuts</PopoverTitle>
          </PopoverHeader>
          {shortcutItems.length > 0 ? (
            <ul
              aria-label="Available keyboard shortcuts"
              className="grid gap-2"
            >
              {shortcutItems.map((item) => (
                <li
                  key={`${item.label}-${item.keys.join("-")}`}
                  className="flex items-center justify-between gap-4 rounded-md bg-muted/60 px-3 py-2"
                >
                  <span className="text-sm text-muted-foreground">
                    {item.label}
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    {item.keys.map((key) => (
                      <kbd
                        key={key}
                        className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground shadow-sm"
                      >
                        {key}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No keyboard shortcuts are available right now.
            </p>
          )}
        </PopoverContent>
      </Popover>
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
