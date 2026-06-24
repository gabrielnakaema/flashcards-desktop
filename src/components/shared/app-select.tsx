import {
  SelectContent,
  SelectItem,
  Select as SelectPrimitive,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface AppSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

export const AppSelect = ({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  className = "",
  id,
  "aria-label": ariaLabel,
}: AppSelectProps) => {
  return (
    <SelectPrimitive value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          "w-full rounded-sm border border-input bg-zinc-900 px-3.5 py-3 text-[0.9375rem] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary focus:shadow-sm h-fit min-h-12",
          className
        )}
        id={id}
        aria-label={ariaLabel}
      >
        <SelectValue placeholder={placeholder} className={cn("bg-zinc-900")} />
      </SelectTrigger>
      <SelectContent className="bg-zinc-900 rounded-sm border-none shadow-none">
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="text-[0.9375rem] text-foreground rounded-none bg-zinc-900 px-3.5 py-3 hover:bg-zinc-800 transition-colors"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectPrimitive>
  );
};
