import { Badge } from "@repo/web-ui/badge";
import { Show } from "@repo/web-ui/show";
import { Spinner } from "@repo/web-ui/spinner";

import type { FileVersionDto } from "@/lib/api-types";

import { formatBytes, formatMimeType } from "@/features/files/model/files-formatting";
import { timeAgo } from "@/lib/format";

interface FilesVersionListProps {
  data: FileVersionDto[] | undefined;
  isLoading: boolean;
}

export function FilesVersionList({ data, isLoading }: FilesVersionListProps) {
  return (
    <div className="space-y-2">
      <Show when={isLoading}>
        <Spinner className="size-4" />
      </Show>
      {!isLoading && data?.length ? (
        data.map((v: FileVersionDto) => (
          <div
            key={v.id}
            className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
          >
            <div>
              <span className="font-medium">v{v.versionNumber}</span>
              <span className="ml-2 text-muted-foreground">
                {formatBytes(v.sizeBytes)} · {timeAgo(v.createdAt)}
              </span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {formatMimeType(v.mimeType)}
            </Badge>
          </div>
        ))
      ) : !isLoading ? (
        <p className="text-sm text-muted-foreground">No version history.</p>
      ) : null}
    </div>
  );
}
