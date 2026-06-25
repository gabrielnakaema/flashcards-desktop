import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/shared/lib/utils";

const appButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-sm font-medium tracking-tight font-mono transition-colors disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-orange-400 bg-orange-400 text-zinc-950 hover:bg-orange-500 hover:border-orange-500",
        secondary:
          "border border-border bg-zinc-950 text-muted-foreground hover:bg-zinc-900 hover:text-foreground",
      },
      size: {
        default: "px-4 py-2 text-sm",
        lg: "px-4 py-3 text-sm",
        sm: "px-3 py-2 text-xs gap-1",
        xs: "px-3 py-1.5 text-xs gap-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function AppButton({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof appButtonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      className={cn(appButtonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { AppButton, appButtonVariants };
