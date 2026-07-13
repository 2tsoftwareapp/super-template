import { Badge } from "@repo/web-ui/badge";
import { Show } from "@repo/web-ui/show";
import { Spinner } from "@repo/web-ui/spinner";

import type { FileHistoryEventDto } from "@/lib/api-types";

import { timeAgo } from "@/lib/format";

interface FilesHistoryListProps {
  data: FileHistoryEventDto[] | undefined;
  isLoading: boolean;
}

export function FilesHistoryList({ data, isLoading }: FilesHistoryListProps) {
  return (
    <div className="space-y-2">
      <Show when={isLoading}>
        <Spinner className="size-4" />
      </Show>
      {!isLoading && data?.length ? (
        data.map((event: FileHistoryEventDto, i: number) => (
          <div
            key={`${event.createdAt}-${event.action}-${i}`}
            className="rounded-lg border border-border p-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs capitalize">
                {event.action.replace(/_/g, " ")}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {timeAgo(event.createdAt)}
              </span>
            </div>
            {event.metadata &&
              typeof event.metadata === "object" &&
              Object.keys(
                event.metadata as Record<string, unknown>,
              ).length > 0 && (
                <pre className="mt-2 overflow-x-auto rounded bg-muted p-2 text-xs">
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              )}
          </div>
        ))
      ) : !isLoading ? (
        <p className="text-sm text-muted-foreground">No history events.</p>
      ) : null}
    </div>
  );
}
