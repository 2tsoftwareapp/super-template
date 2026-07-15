"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
      toast.success("Switched organization");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Could not switch organization");
    },
  });
}

export function useCreateOrganizationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrganizationInput) => createOrganizationApi(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationsKeys.all });
      queryClient.invalidateQueries({ queryKey: organizationsKeys.my });
      toast.success("Organization created successfully");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create organization");
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
      toast.success("Organization renamed successfully");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to rename organization");
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
      toast.success("Organization deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete organization");
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
      toast.success("Left organization successfully");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to leave organization");
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
      toast.success("Member role updated successfully");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update member role");
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
      toast.success("Member removed successfully");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to remove member");
    },
  });
}
