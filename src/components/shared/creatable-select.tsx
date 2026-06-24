import { useState } from "react";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  Loader2Icon,
  PlusIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const LABEL_CLASS =
  "text-[11px] font-mono tracking-wide text-muted-foreground uppercase";

interface Option {
  value: string;
  label: string;
}

interface CreatableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  onCreate: (query: string) => Promise<void>;
  emptyMessage?: string;
  placeholder?: string;
  isLoading?: boolean;
  id?: string;
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const CreatableSelect = ({
  options,
  value,
  onChange,
  onCreate,
  emptyMessage = "No options found.",
  placeholder = "Search...",
  isLoading = false,
  id,
  label,
  error,
  containerClassName,
}: CreatableSelectProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const errorId = id && error ? `${id}-error` : undefined;
  const hasWrapper = label !== undefined || error !== undefined;

  const selectedLabel = options.find((opt) => opt.value === value)?.label;

  const exactMatch = options.some(
    (opt) => opt.label.toLowerCase() === query.toLowerCase()
  );
  const showCreate = query.trim() !== "" && !exactMatch;

  const comboboxEl = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-describedby={errorId}
          aria-invalid={error ? true : undefined}
          className="w-full justify-between font-normal rounded-sm border border-input bg-zinc-900 px-3.5 py-3 text-[0.9375rem] text-foreground h-fit min-h-12 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary focus:shadow-sm"
        >
          {selectedLabel ?? <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0 rounded-sm border-none shadow-none bg-zinc-900">
        <Command>
          <CommandInput
            placeholder={placeholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup className="w-full">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="w-full flex items-center justify-between"
                >
                  {option.label}
                  <CheckIcon
                    className={cn(
                      "size-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
              {showCreate && (
                <CommandItem
                  value={`__create__:${query}`}
                  onSelect={() => {
                    if (isLoading) return;
                    onCreate(query);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  {isLoading ? (
                    <Loader2Icon className="size-4 shrink-0 animate-spin" />
                  ) : (
                    <PlusIcon className="size-4 shrink-0" />
                  )}
                  Create &quot;{query}&quot;
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  if (!hasWrapper) return comboboxEl;

  return (
    <div className={cn("flex flex-col gap-2", containerClassName)}>
      {label && (
        <label htmlFor={id} className={LABEL_CLASS}>
          {label}
        </label>
      )}
      {comboboxEl}
      {error && errorId && (
        <p id={errorId} role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};
