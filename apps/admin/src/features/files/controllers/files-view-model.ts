import type {
  FileDto,
  FileHistoryEventDto,
  FileVersionDto,
} from "@/lib/api-types";

export interface FilesViewModel {
  header: {
    isFetching: boolean;
    total: number;
    onRefresh: () => void;
  };
  toolbar: {
    search: string;
    onSearchChange: (value: string) => void;
    hasFilters: boolean;
    onClearFilters: () => void;
    mimeFilter: string;
    onMimeFilterChange: (value: string) => void;
  };
  list: {
    isLoading: boolean;
    files: FileDto[];
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
    resultLabel: string;
    onRowClick: (file: FileDto) => void;
    onDeleteClick: (file: FileDto) => void;
    hasFilters: boolean;
  };
  upload: {
    isPending: boolean;
    onUpload: (file: File) => void;
  };
  detail: {
    file: FileDto | null;
    description: string;
    onClose: () => void;
    onDownload: () => void;
    onDelete: () => void;
  };
  versions: {
    data: FileVersionDto[] | undefined;
    isLoading: boolean;
  };
  history: {
    data: FileHistoryEventDto[] | undefined;
    isLoading: boolean;
  };
  detailTabs: {
    activeTab: "versions" | "history";
    onTabChange: (tab: "versions" | "history") => void;
    uploadVersion: {
      isPending: boolean;
      onUpload: (file: File) => void;
    };
  };
  confirmDelete: {
    target: FileDto | null;
    isPending: boolean;
    onCancel: () => void;
    onConfirm: () => void;
  };
}
