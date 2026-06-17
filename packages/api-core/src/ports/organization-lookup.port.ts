export interface OrganizationLookup {
  findPrimaryOrganizationId(
    userId: string,
    executor?: unknown,
  ): Promise<string | null>;
}

export const ORGANIZATION_LOOKUP = Symbol('ORGANIZATION_LOOKUP');
