import * as React from "react";
import { cn } from "@/lib/utils";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { sm: "size-7 text-xs", md: "size-9 text-sm", lg: "size-11 text-base" };
  return (
    <div
      aria-label={name}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground",
        sizes[size],
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}

export { Avatar };
