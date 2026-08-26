/**
 * Shared admin-console resource contract. Feature plugins export their own
 * `AdminResourceConfig[]` slices; the admin app concatenates them in
 * `apps/admin/src/lib/admin-resources.ts`. The icon type is generic so this
 * kernel package never depends on `lucide-react`.
 */
export const adminResourceGroups = ["Overview", "People", "Operations", "System"] as const;

export type AdminResourceGroup = (typeof adminResourceGroups)[number];

export type AdminResourceFeature = "list" | "create" | "show" | "edit";

export interface AdminResourceConfig<TIcon = unknown> {
  id: string;
  label: string;
  group: AdminResourceGroup;
  path: string;
  icon: TIcon;
  features: AdminResourceFeature[];
  permissions?: string[];
  queryKey: string;
}

/** Flatten feature-contributed resource slices into the admin nav registry. */
export function composeAdminResources<TIcon>(
  slices: readonly (readonly AdminResourceConfig<TIcon>[])[],
): AdminResourceConfig<TIcon>[] {
  return slices.flatMap((slice) => [...slice]);
}
