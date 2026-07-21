export const FILE_MIME_OPTIONS = [
  { value: "", label: "All types" },
  { value: "image/", label: "Image" },
  { value: "video/", label: "Video" },
  { value: "audio/", label: "Audio" },
  { value: "application/pdf", label: "PDF" },
  { value: "text/", label: "Text" },
] as const;

export type FileMimeFilter = (typeof FILE_MIME_OPTIONS)[number]["value"];
