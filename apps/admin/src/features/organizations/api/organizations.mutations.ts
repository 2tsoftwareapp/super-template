"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { switchOrganization } from "./organizations.api";

export function useSwitchOrganizationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (organizationId: string) => switchOrganization(organizationId),
    onSuccess: async () => {
      // Every cached resource belongs to the previous tenant — drop it all.
      await queryClient.invalidateQueries();
      toast.success("Switched organization");
    },
    onError: () => {
      toast.error("Could not switch organization");
    },
  });
}
