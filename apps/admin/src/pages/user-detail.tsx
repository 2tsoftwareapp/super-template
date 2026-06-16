import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { PageHeader } from "../components/page-header";
import { webFetch } from "../lib/http";
import type { AdminUserDto, ListResponse, ReplaceUserRolesInput, RoleDto, UpdateAdminUserInput, UpdateUserStatusInput } from "../lib/types";

const profileSchema = z.object({
  email: z.email(),
  displayName: z.string().min(2),
});

const statusSchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "BLOCKED"]),
});

const rolesSchema = z.object({
  roleIds: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;
type StatusForm = z.infer<typeof statusSchema>;
type RolesForm = z.infer<typeof rolesSchema>;

export function UserDetailPage() {
  const params = useParams();
  const userId = params.id;
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const user = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: () => webFetch<{ data: AdminUserDto }>(`/api/v1/admin/users/${userId}`),
    enabled: Boolean(userId),
  });
  const roles = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => webFetch<ListResponse<RoleDto>>("/api/v1/admin/roles"),
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      email: user.data?.data.email ?? "",
      displayName: user.data?.data.displayName ?? "",
    },
  });
  const statusForm = useForm<StatusForm>({
    resolver: zodResolver(statusSchema),
    values: {
      status: user.data?.data.status ?? "ACTIVE",
    },
  });
  const rolesForm = useForm<RolesForm>({
    resolver: zodResolver(rolesSchema),
    values: {
      roleIds: user.data?.data.roles?.join(", ") ?? "",
    },
  });

  const updateProfile = useMutation({
    mutationFn: (input: UpdateAdminUserInput) =>
      webFetch<{ data: AdminUserDto }>(`/api/v1/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
    },
  });
  const updateStatus = useMutation({
    mutationFn: (input: UpdateUserStatusInput) =>
      webFetch<{ data: AdminUserDto }>(`/api/v1/admin/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
    },
  });
  const replaceRoles = useMutation({
    mutationFn: (input: ReplaceUserRolesInput) =>
      webFetch<{ data: AdminUserDto }>(`/api/v1/admin/users/${userId}/roles`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
    },
  });
  const deleteUser = useMutation({
    mutationFn: () =>
      webFetch(`/api/v1/admin/users/${userId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      void navigate("/users", { replace: true });
    },
  });

  if (!userId) {
    return null;
  }

  const currentUser = user.data?.data;

  return (
    <div className="space-y-6">
      <PageHeader
        label="User detail"
        title={currentUser?.displayName ?? "Loading user"}
        description="Edit profile data, status, and role assignments from the admin workspace."
      />
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">Profile</CardTitle>
            <CardDescription>Core user data.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={profileForm.handleSubmit((values) => {
                void updateProfile.mutateAsync({
                  email: values.email,
                  displayName: values.displayName,
                });
              })}
            >
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input id="profile-email" {...profileForm.register("email")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-name">Display name</Label>
                <Input id="profile-name" {...profileForm.register("displayName")} />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? "Saving..." : "Save profile"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Access</CardTitle>
            <CardDescription>Status and roles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form
              className="space-y-3"
              onSubmit={statusForm.handleSubmit((values) => {
                void updateStatus.mutateAsync({ status: values.status });
              })}
            >
              <div className="space-y-2">
                <Label htmlFor="user-status">Status</Label>
                <select
                  id="user-status"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  {...statusForm.register("status")}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="BLOCKED">BLOCKED</option>
                </select>
              </div>
              <Button type="submit" variant="outline" disabled={updateStatus.isPending}>
                {updateStatus.isPending ? "Updating..." : "Update status"}
              </Button>
            </form>
            <form
              className="space-y-3"
              onSubmit={rolesForm.handleSubmit((values) => {
                const roleIds = values.roleIds?.trim()
                  ? values.roleIds.split(",").map((value) => value.trim()).filter(Boolean)
                  : [];
                void replaceRoles.mutateAsync({ roleIds });
              })}
            >
              <div className="space-y-2">
                <Label htmlFor="user-roles">Role IDs</Label>
                <Input id="user-roles" {...rolesForm.register("roleIds")} />
              </div>
              <div className="text-xs text-muted-foreground">
                Available roles: {roles.data?.data.length ? roles.data.data.map((role) => `${role.name} (${role.id})`).join(", ") : "loading..."}
              </div>
              <Button type="submit" variant="outline" disabled={replaceRoles.isPending}>
                {replaceRoles.isPending ? "Saving..." : "Replace roles"}
              </Button>
            </form>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => void deleteUser.mutateAsync()}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? "Deleting..." : "Delete user"}
            </Button>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Snapshot</CardTitle>
          <CardDescription>Raw admin user state.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>ID: {currentUser?.id}</p>
          <p>Email verified: {currentUser?.emailVerifiedAt ? "Yes" : "No"}</p>
          <p>Roles: {currentUser?.roles.length ? currentUser.roles.join(", ") : "None"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
