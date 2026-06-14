import { cn } from "@/lib/utils";

interface FieldProps {
  containerClassName?: string;
  labelClassName?: string;
  children?: React.ReactNode;
  error?: string;
  label?: string;
  htmlFor?: string;
}

export const Field = ({
  containerClassName,
  labelClassName,
  children,
  error,
  label,
  htmlFor,
}: FieldProps) => {
  return (
    <div className={cn("flex flex-col gap-1", containerClassName)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className={cn("text-sm font-medium", labelClassName)}
        >
          {label}
        </label>
      )}
      {children}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
