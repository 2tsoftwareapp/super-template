import { RefreshCw } from "lucide-react";
import * as React from "react";

import { Button } from "./button";
import { Spinner } from "./spinner";

/**
 * Refresh button — the single refresh pattern for admin resource views.
 * While `isRefreshing` the icon swaps to a spinner and the button is disabled:
 * rows stay visible; only this control spins (resource refresh semantics).
 */
function RefreshButton({
  isRefreshing = false,
  label = "Refresh",
  disabled,
  ...props
}: {
  isRefreshing?: boolean;
  label?: string;
  disabled?: boolean;
} & React.ComponentProps<typeof Button>) {
  return (
    <Button variant="outline" size="sm" disabled={disabled ?? isRefreshing} {...props}>
      {isRefreshing ? (
        <Spinner data-icon="inline-start" />
      ) : (
        <RefreshCw data-icon="inline-start" className="size-3" />
      )}
      {label}
    </Button>
  );
}

export { RefreshButton };
