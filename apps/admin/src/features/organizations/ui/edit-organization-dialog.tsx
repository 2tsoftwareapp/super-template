"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Button } from "@repo/web-ui/button";
import { Input } from "@repo/web-ui/input";
import { Label } from "@repo/web-ui/label";
import { Spinner } from "@repo/web-ui/spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@repo/web-ui/dialog";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { useUpdateOrganizationMutation } from "../api/organizations.mutations";
import {
  type UpdateOrganizationForm,
  createOrganizationSchema,
} from "../model/organizations.schemas";

export function EditOrganizationDialog({
  open,
  onClose,
  organizationId,
  currentName,
}: {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  currentName: string;
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

  const updateOrg = useUpdateOrganizationMutation(organizationId);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateOrg.mutateAsync({ name: values.name });
      onClose();
    } catch {
      // toast handled inside mutation
    }
  });

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Organization</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-name">Organization Name</Label>
            <Input
              id="edit-name"
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
          <DialogFooter className="mt-4 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={updateOrg.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateOrg.isPending}>
              {updateOrg.isPending ? <Spinner data-icon="inline-start" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
