"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  switchOrganization,
  createOrganizationApi,
  updateOrganizationApi,
  deleteOrganizationApi,
  leaveOrganizationApi,
  updateMemberRoleApi,
  removeMemberApi,
} from "./organizations.api";
import { organizationsKeys } from "./organizations.query-keys";
import type { CreateOrganizationInput, UpdateOrganizationInput } from "@/lib/api-types";

export function useSwitchOrganizationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (organizationId: string) => switchOrganization(organizationId),
    onSuccess: async () => {
      // Every cached resource belongs to the previous tenant — drop it all.
      await queryClient.invalidateQueries();
          },
    onError: () => {},
  });
}

export function useCreateOrganizationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrganizationInput) => createOrganizationApi(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationsKeys.all });
      queryClient.invalidateQueries({ queryKey: organizationsKeys.my });
          },
  });
}

export function useUpdateOrganizationMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateOrganizationInput) => updateOrganizationApi(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationsKeys.all });
      queryClient.invalidateQueries({ queryKey: organizationsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: organizationsKeys.my });
          },
  });
}

export function useDeleteOrganizationMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteOrganizationApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationsKeys.all });
      queryClient.invalidateQueries({ queryKey: organizationsKeys.my });
          },
  });
}

export function useLeaveOrganizationMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => leaveOrganizationApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationsKeys.all });
      queryClient.invalidateQueries({ queryKey: organizationsKeys.my });
          },
  });
}

export function useUpdateMemberRoleMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      updateMemberRoleApi(orgId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationsKeys.members(orgId) });
          },
  });
}

export function useRemoveMemberMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => removeMemberApi(orgId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationsKeys.members(orgId) });
      queryClient.invalidateQueries({ queryKey: organizationsKeys.detail(orgId) });
          },
  });
}
