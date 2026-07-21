export interface JobManagementPermissions {
  canCancel: boolean;
}

export function selectJobPermissions(
  permissions: readonly string[] | undefined,
): JobManagementPermissions {
  const granted = new Set(permissions ?? []);

  return {
    canCancel: granted.has("jobs.update"),
  };
}
