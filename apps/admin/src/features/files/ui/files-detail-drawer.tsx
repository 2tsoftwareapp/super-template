import { Button } from "@repo/web-ui/button";
import { LoadingButton } from "@repo/web-ui/loading-button";
import { Download, History, Layers, Trash2, Upload } from "lucide-react";

import type {
  FileDto,
  FileHistoryEventDto,
  FileVersionDto,
} from "@/lib/api-types";

import { ResourceDrawer } from "@/components/resource-drawer";
import { cn } from "@/lib/utils";

import { FilesDetailMetadata } from "./files-detail-metadata";
import { FilesHistoryList } from "./files-history-list";
import { FilesVersionList } from "./files-version-list";

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
  canDelete: boolean;
  isDownloading: boolean;
  versionsData: FileVersionDto[] | undefined;
  versionsLoading: boolean;
  versionsError: boolean;
  onRetryVersions: () => void;
  historyData: FileHistoryEventDto[] | undefined;
  historyLoading: boolean;
  historyError: boolean;
  onRetryHistory: () => void;
  activeTab: "versions" | "history";
  onTabChange: (tab: "versions" | "history") => void;
  onNewVersionClick: () => void;
  isUploadingVersion: boolean;
  canUploadVersion: boolean;
  formatBytes: (bytes: number) => string;
  formatMimeType: (mime: string) => string;
}

function FilesDetailTabNav({
  activeTab,
  onTabChange,
}: {
  activeTab: "versions" | "history";
  onTabChange: (tab: "versions" | "history") => void;
}) {
  return (
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
  );
}

export function FilesDetailDrawer({
  file,
  description,
  onClose,
  onDownload,
  onDelete,
  canDelete,
  isDownloading,
  versionsData,
  versionsLoading,
  versionsError,
  onRetryVersions,
  historyData,
  historyLoading,
  historyError,
  onRetryHistory,
  activeTab,
  onTabChange,
  onNewVersionClick,
  isUploadingVersion,
  canUploadVersion,
  formatBytes,
  formatMimeType,
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
            <LoadingButton
              size="sm"
              variant="outline"
              onClick={onDownload}
              loading={isDownloading}
            >
              <Download data-icon="inline-start" />
              Download
            </LoadingButton>
            {canUploadVersion ? (
              <LoadingButton
                size="sm"
                variant="outline"
                onClick={onNewVersionClick}
                loading={isUploadingVersion}
              >
                <Upload data-icon="inline-start" />
                New version
              </LoadingButton>
            ) : null}
            {canDelete ? (
              <Button
                size="sm"
                variant="outline"
                className="text-destructive"
                onClick={onDelete}
              >
                <Trash2 data-icon="inline-start" />
                Delete
              </Button>
            ) : null}
          </div>
        ) : undefined
      }
    >
      {file && (
        <div className="space-y-4">
          <FilesDetailMetadata file={file} />
          <FilesDetailTabNav activeTab={activeTab} onTabChange={onTabChange} />

          {activeTab === "versions" && (
            <FilesVersionList
              data={versionsData}
              isLoading={versionsLoading}
              isError={versionsError}
              onRetry={onRetryVersions}
              formatBytes={formatBytes}
              formatMimeType={formatMimeType}
            />
          )}

          {activeTab === "history" && (
            <FilesHistoryList
              data={historyData}
              isLoading={historyLoading}
              isError={historyError}
              onRetry={onRetryHistory}
            />
          )}
        </div>
      )}
    </ResourceDrawer>
  );
}
