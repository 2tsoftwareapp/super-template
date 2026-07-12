import { ConfirmDialog } from "@repo/web-core/components/confirm-dialog";

interface UsersConfirmBlockDialogProps {
  open: boolean;
  label: string;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function UsersConfirmBlockDialog({
  open,
  label,
  isLoading,
  onCancel,
  onConfirm,
}: UsersConfirmBlockDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title="Block user"
      message={`Block ${label}? Their active sessions will be revoked.`}
      confirmLabel="Block"
      destructive
      loading={isLoading}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
