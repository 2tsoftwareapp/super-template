import { Label } from "@repo/web-ui/label";
import { Separator } from "@repo/web-ui/separator";

import type { FileDto } from "@/lib/api-types";

import { formatDateTime, scalarString, truncateId } from "@/lib/format";

interface FilesDetailMetadataProps {
  file: FileDto;
}

export function FilesDetailMetadata({ file }: FilesDetailMetadataProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">ID</Label>
          <p className="text-sm font-mono">{truncateId(file.id)}</p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Uploaded by</Label>
          <p className="text-sm">{scalarString(file.uploadedById)}</p>
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
    </>
  );
}
