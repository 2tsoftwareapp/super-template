"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreateOrganizationInput, UpdateOrganizationInput } from "@/lib/api-types";

import { organizationsApi } from "./organizations.api";
import { organizationsKeys } from "./organizations.query-keys";

export function useSwitchOrganizationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (organizationId: string) => organizationsApi.switch(organizationId),
    onSuccess: () => {
      // Every cached resource belongs to the previous tenant — drop it all.
      // queryClient.clear() prevents data from the old org leaking into the
      // new context (§19 R6).
      queryClient.clear();
    },
  });
}

export function useCreateOrganizationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrganizationInput) => organizationsApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organizationsKeys.all });
    },
  });
}

export function useUpdateOrganizationMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateOrganizationInput) => organizationsApi.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organizationsKeys.all });
    },
  });
}

export function useDeleteOrganizationMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => organizationsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organizationsKeys.all });
    },
  });
}

export function useLeaveOrganizationMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => organizationsApi.leave(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organizationsKeys.all });
    },
  });
}

export function useUpdateMemberRoleMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      organizationsApi.updateMemberRole(orgId, userId, role),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: organizationsKeys.members(orgId),
      });
    },
  });
}

export function useRemoveMemberMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => organizationsApi.removeMember(orgId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: organizationsKeys.members(orgId),
      });
      void queryClient.invalidateQueries({
        queryKey: organizationsKeys.detail(orgId),
      });
    },
  });
}
