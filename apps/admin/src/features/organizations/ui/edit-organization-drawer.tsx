"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Button } from "@repo/web-ui/button";
import { Input } from "@repo/web-ui/input";
import { Label } from "@repo/web-ui/label";
import { Spinner } from "@repo/web-ui/spinner";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ResourceDrawer } from "@repo/web-ui/resource-drawer";
import {
  createOrganizationSchema,
  type UpdateOrganizationForm,
} from "../model/organizations.schemas";

export function EditOrganizationDrawer({
  open,
  onClose,
  currentName,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  currentName: string;
  onSubmit: (values: UpdateOrganizationForm) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<UpdateOrganizationForm>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: currentName,
    },
  });

  useEffect(() => {
    if (open) {
      form.setValue("name", currentName);
    }
  }, [open, currentName, form]);

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values);
  });

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  return (
    <ResourceDrawer
      open={open}
      title="Rename Organization"
      description="Update the organization workspace name."
      onClose={handleClose}
      footer={
        <Button type="submit" form="edit-org-form" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
          Save Changes
        </Button>
      }
    >
      <form id="edit-org-form" className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-name">Organization Name</Label>
          <Input
            id="edit-name"
            placeholder="e.g. Acme Corp"
            aria-invalid={Boolean(form.formState.errors.name)}
            {...form.register("name")}
          />
          {form.formState.errors.name ? (
            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
          ) : null}
        </div>
      </form>
    </ResourceDrawer>
  );
}
