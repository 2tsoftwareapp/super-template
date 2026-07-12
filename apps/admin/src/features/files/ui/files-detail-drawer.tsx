import { Badge } from "@repo/web-core/components/badge";
import { Button } from "@repo/web-core/components/button";
import { Label } from "@repo/web-core/components/label";
import { LoadingButton } from "@repo/web-core/components/loading-button";
import { Separator } from "@repo/web-core/components/separator";
import { Show } from "@repo/web-core/components/show";
import { Spinner } from "@repo/web-core/components/spinner";
import { Download, History, Layers, Trash2, Upload } from "lucide-react";

import type {
  FileDto,
  FileHistoryEventDto,
  FileVersionDto,
} from "@/lib/api-types";

import { ResourceDrawer } from "@/components/resource-drawer";
import { formatBytes, formatMimeType } from "@/features/files/model/files-formatting";
import { formatDateTime, scalarString, timeAgo, truncateId } from "@/lib/format";
import { cn } from "@/lib/utils";

const tabOptions = [
  { value: "versions" as const, label: "Versions", icon: Layers },
  { value: "history" as const, label: "History", icon: History },
];

interface FilesDetailDrawerProps {
  file: FileDto | null;
  description: string;
  onClose: () => void;
  onDownload: () => void;
  onDelete: () => void;
  versionsData: FileVersionDto[] | undefined;
  versionsLoading: boolean;
  historyData: FileHistoryEventDto[] | undefined;
  historyLoading: boolean;
  activeTab: "versions" | "history";
  onTabChange: (tab: "versions" | "history") => void;
  onNewVersionClick: () => void;
  isUploadingVersion: boolean;
}

export function FilesDetailDrawer({
  file,
  description,
  onClose,
  onDownload,
  onDelete,
  versionsData,
  versionsLoading,
  historyData,
  historyLoading,
  activeTab,
  onTabChange,
  onNewVersionClick,
  isUploadingVersion,
}: FilesDetailDrawerProps) {
  return (
    <ResourceDrawer
      open={!!file}
      title={file?.originalName ?? ""}
      description={description}
      onClose={onClose}
      footer={
        file ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onDownload}>
              <Download data-icon="inline-start" />
              Download
            </Button>
            <LoadingButton
              size="sm"
              variant="outline"
              onClick={onNewVersionClick}
              loading={isUploadingVersion}
            >
              <Upload data-icon="inline-start" />
              New version
            </LoadingButton>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive"
              onClick={onDelete}
            >
              <Trash2 data-icon="inline-start" />
              Delete
            </Button>
          </div>
        ) : undefined
      }
    >
      {file && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">ID</Label>
              <p className="text-sm font-mono">{truncateId(file.id)}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Uploaded by
              </Label>
              <p className="text-sm">
                {scalarString(file.uploadedById)}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Created</Label>
              <p className="text-sm">{formatDateTime(file.createdAt)}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Updated</Label>
              <p className="text-sm">{formatDateTime(file.updatedAt)}</p>
            </div>
          </div>

          <Separator />

          <div className="flex gap-1 border-b border-border pb-1">
            {tabOptions.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <Button
                  key={tab.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => onTabChange(tab.value)}
                  className={cn(
                    "relative rounded-b-none",
                    activeTab === tab.value &&
                      "after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-full after:bg-primary",
                  )}
                >
                  <TabIcon className="mr-2 size-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>

          {activeTab === "versions" && (
            <div className="space-y-2">
              <Show when={versionsLoading}>
                <Spinner className="size-4" />
              </Show>
              {!versionsLoading && versionsData?.length ? (
                versionsData.map((v: FileVersionDto) => (
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
              ) : !versionsLoading ? (
                <p className="text-sm text-muted-foreground">
                  No version history.
                </p>
              ) : null}
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-2">
              <Show when={historyLoading}>
                <Spinner className="size-4" />
              </Show>
              {!historyLoading && historyData?.length ? (
                historyData.map((event: FileHistoryEventDto, i: number) => (
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
              ) : !historyLoading ? (
                <p className="text-sm text-muted-foreground">
                  No history events.
                </p>
              ) : null}
            </div>
          )}
        </div>
      )}
    </ResourceDrawer>
  );
}
