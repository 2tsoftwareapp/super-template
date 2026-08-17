"use client";

import * as React from "react";

import type { ButtonVariantProps } from "./button-variants";

import { Button } from "./button";
import { Spinner } from "./spinner";

interface LoadingButtonProps extends React.ComponentProps<typeof Button>, ButtonVariantProps {
  loading?: boolean;
}

function LoadingButton({ loading = false, children, disabled, ...props }: LoadingButtonProps) {
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- need || because false && loading should disable
  const isDisabled = disabled || loading;

  return (
    <Button disabled={isDisabled} {...props}>
      {loading && <Spinner data-icon="inline-start" className="size-4" />}
      {children}
    </Button>
  );
}

export { LoadingButton };
