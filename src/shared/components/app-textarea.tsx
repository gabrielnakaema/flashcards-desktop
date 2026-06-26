import { cn } from "@/shared/lib/utils";
import React, { forwardRef } from "react";

const LABEL_CLASS =
  "text-[11px] font-mono tracking-wide text-muted-foreground uppercase";

interface AppTextareaProps extends React.ComponentPropsWithoutRef<"textarea"> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const AppTextarea = forwardRef<HTMLTextAreaElement, AppTextareaProps>(
  ({ className, label, error, id, containerClassName, ...props }, ref) => {
    const errorId = id && error ? `${id}-error` : undefined;
    const hasWrapper = label !== undefined || error !== undefined;

    const textareaEl = (
      <textarea
        ref={ref}
        id={id}
        aria-describedby={errorId}
        aria-invalid={error ? true : undefined}
        className={cn(
          "w-full min-h-32 resize-y rounded-sm border border-input bg-input-background dark:bg-input-background px-3.5 py-3 text-[0.9375rem] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary focus:shadow-sm",
          className
        )}
        {...props}
      />
    );

    if (!hasWrapper) return textareaEl;

    return (
      <div className={cn("flex flex-col gap-2", containerClassName)}>
        {label && (
          <label htmlFor={id} className={LABEL_CLASS}>
            {label}
          </label>
        )}
        {textareaEl}
        {error && errorId && (
          <p id={errorId} role="alert" className="text-xs text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AppTextarea.displayName = "AppTextarea";
