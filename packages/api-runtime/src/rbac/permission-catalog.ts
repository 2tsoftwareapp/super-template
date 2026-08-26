export type PermissionScope = "platform" | "organization";

/**
 * Fail-closed default when a resource is unknown: treat as platform-scoped.
 * The authoritative map is installed at composition time via
 * {@link setResourceScopeCatalog} from feature `resourceScopes`.
 */
let resourceScopeCatalog: Readonly<Record<string, PermissionScope>> = {};

export function setResourceScopeCatalog(catalog: Readonly<Record<string, PermissionScope>>): void {
  resourceScopeCatalog = catalog;
}

export function getResourceScopeCatalog(): Readonly<Record<string, PermissionScope>> {
  return resourceScopeCatalog;
}

/** @deprecated Use composed feature resourceScopes; retained for transitional typing. */
export type CatalogResource = string;

export function scopeForResource(resource: string): PermissionScope {
  return resourceScopeCatalog[resource] ?? "platform";
}

export function scopeForPermission(name: string): PermissionScope {
  const dot = name.indexOf(".");
  return dot !== -1 ? scopeForResource(name.slice(0, dot)) : "platform";
}

export function getPlatformResources(): string[] {
  return Object.entries(resourceScopeCatalog)
    .filter(([, s]) => s === "platform")
    .map(([r]) => r);
}

export function getOrganizationResources(): string[] {
  return Object.entries(resourceScopeCatalog)
    .filter(([, s]) => s === "organization")
    .map(([r]) => r);
}
