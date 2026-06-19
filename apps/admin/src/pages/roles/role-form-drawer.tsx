import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ResourceDrawer } from "@/components/resource-drawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { webFetch } from "@/lib/http";

interface PermissionDto {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

export interface EditableRole {
  id: string;
  name: string;
  description: string | null;
  permissions: PermissionDto[];
}

const roleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Role name must be at least 2 characters")
    .max(80, "Role name must be at most 80 characters"),
  description: z.string().max(500).optional(),
  permissionIds: z.array(z.string()).min(1, "Select at least one permission"),
});

type RoleForm = z.infer<typeof roleSchema>;

function permissionDomain(permissionName: string) {
  return permissionName.split(".")[0] ?? "system";
}

export function RoleFormDrawer({
  open,
  onClose,
  role,
  permissions,
}: {
  open: boolean;
  onClose: () => void;
  role: EditableRole | null;
  permissions: PermissionDto[];
}) {
  const queryClient = useQueryClient();
  const isEditing = role !== null;

  const permissionGroups = useMemo(() => {
    const grouped = new Map<string, PermissionDto[]>();
    for (const permission of permissions) {
      const domain = permissionDomain(permission.name);
      const existing = grouped.get(domain) ?? [];
      existing.push(permission);
      grouped.set(domain, existing);
    }
    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [permissions]);

  const form = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissionIds: [],
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: role?.name ?? "",
      description: role?.description ?? "",
      permissionIds: role?.permissions.map((permission) => permission.id) ?? [],
    });
  }, [open, role, form]);

  const saveRole = useMutation({
    mutationFn: async (input: RoleForm) => {
      const payload = {
        name: input.name,
        description: input.description ?? null,
        permissionIds: input.permissionIds,
      };

      if (isEditing && role) {
        return webFetch<{ data: EditableRole & { permissions: PermissionDto[] } }>(`/api/v1/admin/roles/${role.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }

      return webFetch<{ data: EditableRole & { permissions: PermissionDto[] } }>("/api/v1/admin/roles", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      toast.success(isEditing ? "Role updated" : "Role created");
      onClose();
    },
    onError: () => {
      toast.error(isEditing ? "Could not update role" : "Could not create role");
    },
  });

  const selectedPermissionIds = form.watch("permissionIds");

  const togglePermission = (permissionId: string, checked: boolean) => {
    const current = form.getValues("permissionIds");
    form.setValue(
      "permissionIds",
      checked
        ? [...current, permissionId]
        : current.filter((id) => id !== permissionId),
      { shouldValidate: true },
    );
  };

  return (
    <ResourceDrawer
      open={open}
      title={isEditing ? "Edit custom role" : "New custom role"}
      description="Custom roles use permissions from the system catalog and stay scoped to your organization."
      onClose={onClose}
      footer={
        <Button
          type="submit"
          form="role-form"
          className="w-full"
          disabled={saveRole.isPending}
        >
          {saveRole.isPending ? <Spinner data-icon="inline-start" /> : null}
          {isEditing ? "Save changes" : "Create role"}
        </Button>
      }
    >
      <form
        id="role-form"
        className="space-y-6"
        onSubmit={form.handleSubmit((values) => saveRole.mutate(values))}
      >
        <div className="space-y-2">
          <Label htmlFor="role-name">Name</Label>
          <Input id="role-name" {...form.register("name")} />
          {form.formState.errors.name ? (
            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="role-description">Description</Label>
          <Input id="role-description" {...form.register("description")} />
        </div>

        <div className="space-y-3">
          <Label>Permissions</Label>
          {form.formState.errors.permissionIds ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.permissionIds.message}
            </p>
          ) : null}
          <div className="max-h-96 space-y-4 overflow-y-auto rounded-lg border border-border p-3">
            {permissionGroups.map(([domain, items]) => (
              <div key={domain} className="space-y-2">
                <h3 className="text-sm font-medium capitalize">{domain}</h3>
                <div className="space-y-2">
                  {items.map((permission) => {
                    const checked = selectedPermissionIds.includes(permission.id);
                    return (
                      <label
                        key={permission.id}
                        className="flex items-start gap-3 rounded-md border border-border/60 p-2"
                      >
                        <Checkbox
                          checked={checked}
                          onChange={(event) =>
                            togglePermission(permission.id, event.target.checked)
                          }
                        />
                        <span className="min-w-0">
                          <span className="block font-mono text-xs">{permission.name}</span>
                          {permission.description ? (
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {permission.description}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </ResourceDrawer>
  );
}
