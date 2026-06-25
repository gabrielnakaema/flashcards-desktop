import { cn } from "@/shared/lib/utils";

interface AppSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export const AppSwitch = ({
  checked,
  onCheckedChange,
  id,
  disabled,
  className,
}: AppSwitchProps) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full outline-none transition-colors duration-200",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-orange-400" : "bg-[#2a2a2e]",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-[left] duration-200",
          checked ? "left-[18px]" : "left-0.5"
        )}
      />
    </button>
  );
};
