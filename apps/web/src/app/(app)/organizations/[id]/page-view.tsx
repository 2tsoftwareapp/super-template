"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  LogOut,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";

import type {
  ApiEnvelope,
  OrganizationDetailDto,
  OrganizationMemberDto,
} from "@/lib/api-types";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { webFetch } from "@/lib/http";
import { cn } from "@/lib/utils";

const updateNameSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type UpdateNameFormValues = z.infer<typeof updateNameSchema>;

function RoleBadge({ role }: { role: OrganizationDetailDto["role"] }) {
  const variantMap: Record<string, "default" | "secondary" | "outline"> = {
    OWNER: "default",
    ADMIN: "secondary",
    MEMBER: "outline",
  };

  const colorMap: Record<string, string> = {
    OWNER: "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
    ADMIN: "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
    MEMBER: "",
  };

  return (
    <Badge
      variant={variantMap[role] ?? "outline"}
      className={cn("w-fit", colorMap[role])}
    >
      {role}
    </Badge>
  );
}

export function OrganizationDetailView({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const org = useQuery({
    queryKey: ["organizations", id],
    queryFn: () =>
      webFetch<ApiEnvelope<OrganizationDetailDto>>(
        `/api/bff/organizations/${id}`,
      ),
  });

  const members = useQuery({
    queryKey: ["organizations", id, "members"],
    queryFn: () =>
      webFetch<ApiEnvelope<OrganizationMemberDto[]>>(
        `/api/bff/organizations/${id}/members`,
      ),
  });

  const form = useForm<UpdateNameFormValues>({
    resolver: zodResolver(updateNameSchema),
    values: { name: org.data?.data.name ?? "" },
  });

  const updateMutation = useMutation({
    mutationFn: (values: UpdateNameFormValues) =>
      webFetch(`/api/bff/organizations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success("Organization updated");
      setEditing(false);
      void queryClient.invalidateQueries({ queryKey: ["organizations", id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      webFetch(`/api/bff/organizations/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Organization deleted");
      void queryClient.invalidateQueries({ queryKey: ["organizations"] });
      router.replace("/organizations");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const leaveMutation = useMutation({
    mutationFn: () =>
      webFetch(`/api/bff/organizations/${id}/leave`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Left organization");
      void queryClient.invalidateQueries({ queryKey: ["organizations"] });
      router.replace("/organizations");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const roleMutation = useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: string;
    }) =>
      webFetch(`/api/bff/organizations/${id}/members/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => {
      toast.success("Member role updated");
      void queryClient.invalidateQueries({
        queryKey: ["organizations", id, "members"],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) =>
      webFetch(`/api/bff/organizations/${id}/members/${userId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Member removed");
      void queryClient.invalidateQueries({
        queryKey: ["organizations", id, "members"],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (org.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="size-5 text-primary" />
      </div>
    );
  }

  if (org.isError || !org.data) {
    return (
      <div className="max-w-3xl space-y-6">
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <p className="text-destructive">
              {org.error?.message ?? "Failed to load organization"}
            </p>
            <Link
              href="/organizations"
              className="mt-4 inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
              Back to organizations
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = org.data.data;
  const isOwner = data.role === "OWNER";
  const isAdmin = data.role === "ADMIN";
  const canEdit = isOwner || isAdmin;
  const ownerCount =
    members.data?.data.filter((m) => m.role === "OWNER").length ?? 1;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          href="/organizations"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to organizations
        </Link>
      </div>

      <Card className="border-border">
        <CardHeader className="space-y-3">
          <Badge variant="outline" className="w-fit">
            Organization
          </Badge>
          {editing ? (
            <form
              className="space-y-3"
              onSubmit={form.handleSubmit((values) =>
                updateMutation.mutate(values),
              )}
            >
              <div className="flex items-center gap-3">
                <Input
                  {...form.register("name")}
                  className="text-2xl font-bold"
                />
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={updateMutation.isPending}
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-4xl">{data.name}</CardTitle>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isOwner && (
                  <AlertDialog>
                    <AlertDialogTrigger>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete organization</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete{" "}
                          <strong>{data.name}</strong>? This action cannot be
                          undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate()}
                        >
                          {deleteMutation.isPending
                            ? "Deleting..."
                            : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                {!isOwner && (
                  <AlertDialog>
                    <AlertDialogTrigger>
                      <Button variant="outline" size="sm">
                        <LogOut className="mr-2 h-4 w-4" />
                        Leave
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Leave organization</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to leave{" "}
                          <strong>{data.name}</strong>?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          disabled={leaveMutation.isPending}
                          onClick={() => leaveMutation.mutate()}
                        >
                          {leaveMutation.isPending ? "Leaving..." : "Leave"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          )}
          <CardDescription>
            <span className="text-muted-foreground">{data.slug}</span>
            <span className="mx-2">·</span>
            <RoleBadge role={data.role} />
            <span className="mx-2">·</span>
            <span className="text-muted-foreground">
              <Users className="mr-1 inline-block h-3 w-3" />
              {data.memberCount} member{data.memberCount !== 1 ? "s" : ""}
            </span>
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-border">
        <CardHeader className="space-y-3">
          <Badge variant="outline" className="w-fit">
            Members
          </Badge>
          <CardTitle className="text-2xl">Team members</CardTitle>
          <CardDescription>
            Manage members and their roles in this organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner className="size-5 text-primary" />
            </div>
          ) : members.isError ? (
            <p className="text-sm text-destructive">
              {members.error.message}
            </p>
          ) : !members.data || members.data.data.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No members found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  {canEdit && <TableHead className="w-12" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.data.data.map((member) => (
                  <TableRow key={member.userId}>
                    <TableCell className="font-medium">
                      {member.displayName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.email}
                    </TableCell>
                    <TableCell>
                      <MemberRoleCell
                        member={member}
                        isOwner={isOwner}
                        ownerCount={ownerCount}
                        onRoleChange={(role) =>
                          roleMutation.mutate({
                            userId: member.userId,
                            role,
                          })
                        }
                      />
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        {member.role !== "OWNER" && (
                          <AlertDialog>
                            <AlertDialogTrigger>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Remove member
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove{" "}
                                  <strong>{member.displayName}</strong> from
                                  this organization?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  variant="destructive"
                                  disabled={removeMemberMutation.isPending}
                                  onClick={() =>
                                    removeMemberMutation.mutate(member.userId)
                                  }
                                >
                                  {removeMemberMutation.isPending
                                    ? "Removing..."
                                    : "Remove"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MemberRoleCell({
  member,
  isOwner,
  ownerCount,
  onRoleChange,
}: {
  member: OrganizationMemberDto;
  isOwner: boolean;
  ownerCount: number;
  onRoleChange: (role: string) => void;
}) {
  const [editingRole, setEditingRole] = useState(false);
  const [pendingRole, setPendingRole] = useState<string | null>(null);

  if (member.role === "OWNER") {
    return <RoleBadge role={member.role} />;
  }

  if (!isOwner) {
    return <RoleBadge role={member.role} />;
  }

  if (editingRole) {
    return (
      <div className="flex items-center gap-2">
        <Select
          defaultValue={member.role}
          onValueChange={(value) => setPendingRole(value!)}
        >
          <SelectTrigger className="h-8 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">ADMIN</SelectItem>
            <SelectItem value="MEMBER">MEMBER</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            if (pendingRole && pendingRole !== member.role) {
              onRoleChange(pendingRole);
            }
            setEditingRole(false);
          }}
        >
          Save
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setEditingRole(false)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <RoleBadge role={member.role} />
      <Button
        variant="ghost"
        size="icon"
        className="size-6"
        onClick={() => setEditingRole(true)}
      >
        <Pencil className="h-3 w-3" />
      </Button>
    </div>
  );
}
