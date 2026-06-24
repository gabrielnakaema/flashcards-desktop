import { cn } from "@/lib/utils";
import React, { forwardRef } from "react";

interface AppInputProps extends React.ComponentPropsWithoutRef<"input"> {}

export const AppInput = forwardRef<HTMLInputElement, AppInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-sm border border-input bg-zinc-900 px-3.5 py-3 text-[0.9375rem] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary focus:shadow-sm",
          className
        )}
        {...props}
      />
    );
  }
);
