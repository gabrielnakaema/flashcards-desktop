import { cn } from "@/lib/utils";

interface FieldProps {
  containerClassName?: string;
  labelClassName?: string;
  children?: React.ReactNode;
  error?: string;
  label?: string;
}

export const Field = ({
  containerClassName,
  labelClassName,
  children,
  error,
  label,
}: FieldProps) => {
  return (
    <div className={cn("flex flex-col gap-1", containerClassName)}>
      {label && (
        <label className={cn("text-sm font-medium", labelClassName)}>
          {label}
        </label>
      )}
      {children}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
