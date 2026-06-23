export type AccountLinkingDecision =
  | { kind: 'link_existing'; userId: string }
  | { kind: 'create_new' }
  | { kind: 'conflict' };

// Only auto-link an SSO identity onto an existing local account when that account's
// email is already verified. An unverified local account could have been pre-registered
// by an attacker hoping the real owner's first SSO login silently hands over the account.
export const decideAccountLinking = (params: {
  existingUserByEmail: { id: string; emailVerifiedAt: Date | null } | null;
}): AccountLinkingDecision => {
  if (!params.existingUserByEmail) {
    return { kind: 'create_new' };
  }

  if (params.existingUserByEmail.emailVerifiedAt) {
    return { kind: 'link_existing', userId: params.existingUserByEmail.id };
  }

  return { kind: 'conflict' };
};
