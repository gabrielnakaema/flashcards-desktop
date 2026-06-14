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
}

export const CreatableSelect = ({
  options,
  value,
  onChange,
  onCreate,
  emptyMessage = "No options found.",
  placeholder = "Search...",
  isLoading = false,
}: CreatableSelectProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedLabel = options.find((opt) => opt.value === value)?.label;

  const exactMatch = options.some(
    (opt) => opt.label.toLowerCase() === query.toLowerCase()
  );
  const showCreate = query.trim() !== "" && !exactMatch;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selectedLabel ?? placeholder}
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
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
};
