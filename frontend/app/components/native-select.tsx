import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";

export function NativeSelect({
  className,
  ...props
}: ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "h-11 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 text-base outline-none transition-colors",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "md:h-9 md:text-sm dark:bg-input/30",
        className
      )}
      {...props}
    />
  );
}
