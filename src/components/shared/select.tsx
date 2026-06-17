import {
  SelectContent,
  SelectItem,
  Select as SelectPrimitive,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const Select = ({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  className = "",
  id,
}: SelectProps) => {
  return (
    <SelectPrimitive value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className} id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectPrimitive>
  );
};
