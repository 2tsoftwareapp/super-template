import { AlertTriangle } from "lucide-react";
import * as React from "react";

import { cn } from "../utils";
import { Alert } from "./alert";
import { Button } from "./button";

interface ErrorStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: "full-page" | "inline";
}

function ErrorState({
  title,
  description,
  action,
  className,
  variant = "full-page",
}: ErrorStateProps) {
  if (variant === "inline") {
    return (
      <Alert variant="error" className={cn("m-4 mb-0", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4" />
            {title}
          </div>
          {action ? (
            <Button variant="outline" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          ) : null}
        </div>
      </Alert>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-64 items-center justify-center",
        className,
      )}
    >
      <Alert variant="error" className="max-w-md">
        <div className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="size-4" />
          {title}
        </div>
        {description ? <p className="text-sm">{description}</p> : null}
        {action ? (
          <div className="pt-1">
            <Button variant="outline" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          </div>
        ) : null}
      </Alert>
    </div>
  );
}

export { ErrorState };
