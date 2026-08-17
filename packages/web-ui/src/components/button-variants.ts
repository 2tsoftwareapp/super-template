import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs hover:bg-[color-mix(in_oklch,var(--primary),black_10%)]",
        destructive:
          "bg-[var(--destructive)] text-[var(--destructive-foreground)] shadow-xs hover:bg-[color-mix(in_oklch,var(--destructive),black_10%)]",
        outline:
          "border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] shadow-xs hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
        secondary:
          "bg-[var(--secondary)] text-[var(--secondary-foreground)] shadow-xs hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]",
        ghost:
          "text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
        link: "text-[var(--primary)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        sm: "h-8 rounded-md px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        lg: "h-10 rounded-md px-6 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
