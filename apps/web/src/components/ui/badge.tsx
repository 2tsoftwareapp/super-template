import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-neutral-950 px-3 py-1 text-xs font-medium text-white dark:bg-amber-300 dark:text-neutral-950",
        className,
      )}
    >
      {children}
    </span>
  );
}
