import type { OrganizationMemberDto } from "@/lib/api-types";

export type OrganizationRole = OrganizationMemberDto["role"];

export interface OrganizationActorContext {
  actorUserId: string | undefined;
  isSuperAdmin: boolean;
  actorOrgRole: OrganizationRole | undefined;
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
}

/**
 * Derives org-scoped actor flags from session roles and the members directory.
 * Centralizes SUPER_ADMIN / OWNER / ADMIN checks so views receive booleans.
 */
export function selectOrganizationActorContext(
  actorUserId: string | undefined,
  actorRoles: readonly string[] | undefined,
  members: readonly OrganizationMemberDto[],
): OrganizationActorContext {
  const isSuperAdmin = (actorRoles ?? []).includes("SUPER_ADMIN");
  const actorMember = members.find((member) => member.userId === actorUserId);
  const actorOrgRole = actorMember?.role;

  return {
    actorUserId,
    isSuperAdmin,
    actorOrgRole,
    isOwner: actorOrgRole === "OWNER",
    isAdmin: actorOrgRole === "ADMIN",
    isMember: actorOrgRole === "MEMBER",
  };
}

export function canRenameOrganization(ctx: OrganizationActorContext): boolean {
  return ctx.isSuperAdmin || ctx.isOwner || ctx.isAdmin;
}

export function canDeleteOrganization(ctx: OrganizationActorContext): boolean {
  return ctx.isSuperAdmin || ctx.isOwner;
}

export function canLeaveOrganization(
  ctx: OrganizationActorContext,
  members: readonly OrganizationMemberDto[],
): boolean {
  return members.some((member) => member.userId === ctx.actorUserId);
}

export function isLastOwner(
  ctx: OrganizationActorContext,
  members: readonly OrganizationMemberDto[],
): boolean {
  if (ctx.actorOrgRole !== "OWNER") {
    return false;
  }
  return members.filter((member) => member.role === "OWNER").length === 1;
}

export function canManageMember(
  ctx: OrganizationActorContext,
  member: OrganizationMemberDto,
): boolean {
  if (member.userId === ctx.actorUserId) {
    return false;
  }
  return (
    ctx.isSuperAdmin ||
    ctx.isOwner ||
    (ctx.isAdmin && member.role === "MEMBER")
  );
}

export function canPromoteMemberToAdmin(
  member: OrganizationMemberDto,
): boolean {
  return member.role === "MEMBER";
}

export function canDemoteAdminToMember(
  ctx: OrganizationActorContext,
  member: OrganizationMemberDto,
): boolean {
  return member.role === "ADMIN" && (ctx.isSuperAdmin || ctx.isOwner);
}

export function canPromoteAdminToOwner(
  ctx: OrganizationActorContext,
  member: OrganizationMemberDto,
): boolean {
  return member.role === "ADMIN" && (ctx.isSuperAdmin || ctx.isOwner);
}

export function canDemoteOwnerToAdmin(
  ctx: OrganizationActorContext,
  member: OrganizationMemberDto,
): boolean {
  return member.role === "OWNER" && ctx.isSuperAdmin;
}
