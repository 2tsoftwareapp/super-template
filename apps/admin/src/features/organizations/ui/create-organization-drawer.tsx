"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Button } from "@repo/web-ui/button";
import { Input } from "@repo/web-ui/input";
import { Label } from "@repo/web-ui/label";
import { Spinner } from "@repo/web-ui/spinner";
import { useForm } from "react-hook-form";

import { ResourceDrawer } from "@/components/resource-drawer";
import { useCreateOrganizationMutation } from "../api/organizations.mutations";
import {
  type CreateOrganizationForm,
  createOrganizationSchema,
} from "../model/organizations.schemas";

export function CreateOrganizationDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const form = useForm<CreateOrganizationForm>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
    },
  });

  const createOrg = useCreateOrganizationMutation();

  const handleClose = () => {
    form.reset({ name: "" });
    onClose();
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createOrg.mutateAsync({ name: values.name });
      handleClose();
    } catch {
      // toast is already handled inside mutation onSuccess/onError
    }
  });

  return (
    <ResourceDrawer
      open={open}
      title="Create Organization"
      description="Create a new organization workspace."
      onClose={handleClose}
      footer={
        <Button
          type="submit"
          form="create-org-form"
          className="w-full"
          disabled={createOrg.isPending}
        >
          {createOrg.isPending ? <Spinner data-icon="inline-start" /> : null}
          Create Workspace
        </Button>
      }
    >
      <form id="create-org-form" className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Organization name</Label>
          <Input
            id="name"
            placeholder="e.g. Acme Corp"
            aria-invalid={Boolean(form.formState.errors.name)}
            {...form.register("name")}
          />
          {form.formState.errors.name ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>
      </form>
    </ResourceDrawer>
  );
}
