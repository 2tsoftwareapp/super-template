import { LoadingButton } from "@repo/web-ui/loading-button";
import { Show } from "@repo/web-ui/show";
import { CheckCircle2 } from "lucide-react";

import type { UserDetailViewModel } from "@/features/users/controllers/use-user-detail-controller";

import { cn } from "@/lib/utils";

interface UserDetailStatusProps {
  status: UserDetailViewModel["status"];
}

export function UserDetailStatus({ status }: UserDetailStatusProps) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-medium">Status</h4>
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border p-1">
        {status.options.map((s) => (
          <button
            key={s}
            type="button"
            disabled={status.disabled}
            onClick={() => status.onSelect(s)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-40",
              status.selected === s
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s.toLowerCase()}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <LoadingButton
          variant="outline"
          size="sm"
          disabled={!status.canApply}
          onClick={status.onApply}
          loading={status.state.isPending}
        >
          Apply status
        </LoadingButton>
        {status.state.isSuccess && (
          <span className="flex items-center gap-1 text-xs text-primary">
            <CheckCircle2 className="size-3" /> Updated
          </span>
        )}
        <Show when={status.state.isError}>
          <span className="text-xs text-destructive">
            Failed.{" "}
            <button
              type="button"
              className="underline"
              onClick={status.onApply}
            >
              Retry
            </button>
          </span>
        </Show>
      </div>
    </div>
  );
}
