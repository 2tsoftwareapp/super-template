import { cn } from "@repo/web-utils/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 rounded-lg border px-3 py-2 text-left text-sm",
  {
    variants: {
      variant: {
        error: "border-destructive/40 bg-destructive/5 text-destructive",
        warning: "border-yellow-500/40 bg-yellow-500/5 text-yellow-700 dark:text-yellow-400",
        info: "border-blue-500/40 bg-blue-500/5 text-blue-700 dark:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "error",
    },
  },
);

function Alert({
  className,
  variant,
  children,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { Alert };
