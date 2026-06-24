import { cn } from "@/lib/utils";
import React, { forwardRef } from "react";

interface AppTextareaProps extends React.ComponentPropsWithoutRef<"textarea"> {}

export const AppTextarea = forwardRef<HTMLTextAreaElement, AppTextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full min-h-32 resize-y rounded-sm border border-input bg-zinc-900 px-3.5 py-3 text-[0.9375rem] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary focus:shadow-sm",
          className
        )}
        {...props}
      />
    );
  }
);

AppTextarea.displayName = "AppTextarea";
