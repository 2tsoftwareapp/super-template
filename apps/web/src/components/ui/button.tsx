import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-neutral-950 px-4 py-2 text-white hover:bg-neutral-800 dark:bg-amber-300 dark:text-neutral-950 dark:hover:bg-amber-200",
        secondary:
          "bg-white/70 px-4 py-2 text-neutral-900 ring-1 ring-black/10 hover:bg-white dark:bg-white/10 dark:text-white dark:ring-white/10 dark:hover:bg-white/15",
        ghost:
          "px-3 py-2 text-neutral-700 hover:bg-black/5 dark:text-neutral-200 dark:hover:bg-white/10",
        danger: "bg-red-600 px-4 py-2 text-white hover:bg-red-500",
      },
      size: {
        sm: "h-9",
        md: "h-11",
        lg: "h-12 px-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size, variant, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      ref={ref}
      {...props}
    />
  ),
);

Button.displayName = "Button";
