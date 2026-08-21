import * as React from "react";
import * as SlotPrimitive from "@radix-ui/react-slot";
import { cn } from "@repo/web-utils/utils";

import type { ButtonVariantProps } from "./button-variants";

import { buttonVariants } from "./button-variants";

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  ButtonVariantProps & {
    /** Render as a child element (Radix Slot pattern). */
    asChild?: boolean;
  }) {
  const Comp = asChild ? SlotPrimitive.Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
