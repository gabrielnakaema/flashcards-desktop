import {
  SelectContent,
  SelectItem,
  Select as SelectPrimitive,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { cn } from "@/shared/lib/utils";

const LABEL_CLASS =
  "text-[11px] font-mono tracking-wide text-muted-foreground uppercase";

interface AppSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
  label?: string;
  error?: string;
  containerClassName?: string;
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
  label,
  error,
  containerClassName,
}: AppSelectProps) => {
  const errorId = id && error ? `${id}-error` : undefined;
  const hasWrapper = label !== undefined || error !== undefined;

  const selectEl = (
    <SelectPrimitive value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          "w-full rounded-sm border border-input bg-zinc-900 px-3.5 py-3 text-[0.9375rem] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary focus:shadow-sm h-fit min-h-12",
          className
        )}
        id={id}
        aria-label={ariaLabel}
        aria-describedby={errorId}
        aria-invalid={error ? true : undefined}
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

  if (!hasWrapper) return selectEl;

  return (
    <div className={cn("flex flex-col gap-2", containerClassName)}>
      {label && (
        <label htmlFor={id} className={LABEL_CLASS}>
          {label}
        </label>
      )}
      {selectEl}
      {error && errorId && (
        <p id={errorId} role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};
