"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Button } from "@repo/web-ui/button";
import { Input } from "@repo/web-ui/input";
import { Label } from "@repo/web-ui/label";
import { Spinner } from "@repo/web-ui/spinner";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { ResourceDrawer } from "@/components/resource-drawer";

import {
  type CreateOrganizationForm,
  createOrganizationSchema,
} from "../model/organizations.schemas";

export function CreateOrganizationDrawer({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateOrganizationForm) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<CreateOrganizationForm>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
    },
  });

  const handleClose = () => {
    form.reset({ name: "" });
    onClose();
  };

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values);
  });

  useEffect(() => {
    if (!open) {
      form.reset({ name: "" });
    }
  }, [open, form]);

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
          disabled={isSubmitting}
        >
          {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
          Create Workspace
        </Button>
      }
    >
      <form id="create-org-form" className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
