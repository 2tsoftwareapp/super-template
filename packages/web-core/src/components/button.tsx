import { Button as ButtonPrimitive } from "@base-ui/react/button";

import type { ButtonVariantProps } from "./button-variants";

import { cn } from "../utils";
import { buttonVariants } from "./button-variants";

function Button({
  className,
  variant = "default",
  size = "default",
  nativeButton,
  render,
  ...props
}: ButtonPrimitive.Props & ButtonVariantProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      nativeButton={nativeButton ?? render === undefined}
      render={render}
      {...props}
    />
  );
}

export { Button, buttonVariants };
