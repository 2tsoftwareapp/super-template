"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type UploadedFile = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

type FileUploadProps = {
  onUploaded?: (file: UploadedFile) => void;
  accept?: string;
  label?: string;
};

export function FileUpload({
  onUploaded,
  accept,
  label = "Upload file",
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);

    try {
      const response = await fetch("/api/bff/files", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
        headers: {
          "x-csrf-token":
            document.cookie
              .split("; ")
              .find((row) => row.startsWith("csrf_token="))
              ?.split("=")[1] ?? "",
        },
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Upload failed");
      }

      onUploaded?.(payload.data);
      toast.success("File uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => void handleChange(event)}
      />
      <Button
        type="button"
        variant="outline"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? "Uploading..." : label}
      </Button>
    </div>
  );
}

export async function uploadFile(file: File): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/bff/files", {
    method: "POST",
    body: formData,
    credentials: "same-origin",
    headers: {
      "x-csrf-token":
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("csrf_token="))
          ?.split("=")[1] ?? "",
    },
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "Upload failed");
  }

  return payload.data as UploadedFile;
}
