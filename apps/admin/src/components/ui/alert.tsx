import { cn } from "@/lib/utils";

interface AlertProps {
  children: React.ReactNode;
  variant?: "error" | "warning" | "info";
  className?: string;
}

export function Alert({ children, variant = "error", className }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        variant === "error" && "border-destructive/40 bg-destructive/5 text-destructive",
        variant === "warning" && "border-yellow-500/40 bg-yellow-500/5 text-yellow-700 dark:text-yellow-400",
        variant === "info" && "border-blue-500/40 bg-blue-500/5 text-blue-700 dark:text-blue-400",
        className,
      )}
    >
      {children}
    </div>
  );
}
