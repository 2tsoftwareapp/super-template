"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import Link from "next/link";
import { useQueryStates } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";

import type {
  ApiEnvelope,
  CreateAdminUserInput,
  UserDto,
  UsersListResponse,
} from "@/lib/api-types";

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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "@/hooks/use-session";
import { webFetch } from "@/lib/http";
import {
  buildAdminUsersListPath,
  sortOrderOptions,
  userSortFieldOptions,
  usersSearchParams,
  userStatusOptions,
} from "@/lib/search-params";

export function UsersView() {
  const session = useSession();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useQueryStates(usersSearchParams);
  const canReadUsers =
    session.data?.data.permissions.includes("users.read") ?? false;
  const canCreateUsers =
    session.data?.data.permissions.includes("users.create") ?? false;
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateAdminUserInput>({
    email: "",
    password: "",
    displayName: "",
    status: "ACTIVE",
    role: "USER",
  });
  const users = useQuery({
    queryKey: ["users", filters],
    queryFn: () =>
      webFetch<UsersListResponse>(buildAdminUsersListPath(filters)),
    enabled: canReadUsers,
  });

  const createUser = useMutation({
    mutationFn: (input: CreateAdminUserInput) =>
      webFetch<ApiEnvelope<UserDto>>("/api/bff/admin/users", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      toast.success("User created");
      setCreateOpen(false);
      setCreateForm({
        email: "",
        password: "",
        displayName: "",
        status: "ACTIVE",
        role: "USER",
      });
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!canReadUsers) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-3xl">403</CardTitle>
          <CardDescription>
            Your account does not include `users.read`.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Badge variant="outline" className="w-fit">
            Admin
          </Badge>
          <h1 className="text-4xl font-semibold">Users</h1>
        </div>
        {canCreateUsers ? (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button>Create user</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create user</DialogTitle>
                <DialogDescription>
                  Add a new user to the directory.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-email">Email</Label>
                  <Input
                    id="create-email"
                    value={createForm.email}
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-name">Display name</Label>
                  <Input
                    id="create-name"
                    value={createForm.displayName}
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        displayName: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-password">Password</Label>
                  <Input
                    id="create-password"
                    type="password"
                    value={createForm.password}
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createUser.mutate(createForm)}
                  disabled={createUser.isPending}
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-xl">Filters</CardTitle>
          <CardDescription>
            Filter users by status, role, and sort order.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1.8fr)_repeat(4,minmax(0,1fr))]">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by name or email"
              value={filters.search}
              onChange={(event) =>
                void setFilters({
                  search: event.target.value,
                  page: 1,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) =>
                void setFilters({
                  status: value!,
                  page: 1,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {userStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              placeholder="Role name"
              value={filters.role}
              onChange={(event) =>
                void setFilters({
                  role: event.target.value,
                  page: 1,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Sort field</Label>
            <Select
              value={filters.sortField}
              onValueChange={(value) =>
                void setFilters({
                  sortField: value!,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort field" />
              </SelectTrigger>
              <SelectContent>
                {userSortFieldOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Sort order</Label>
            <Select
              value={filters.sortOrder}
              onValueChange={(value) =>
                void setFilters({
                  sortOrder: value!,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                {sortOrderOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border p-0">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-xl">Directory</CardTitle>
          <CardDescription>
            Browse users and their role assignments.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {users.isLoading ? (
            <div className="flex min-h-40 items-center justify-center">
              <Spinner className="size-5 text-primary" />
            </div>
          ) : users.data?.data.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Roles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.data.data.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <Link href={`/users/${user.id}`}>{user.displayName}</Link>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.status}</Badge>
                    </TableCell>
                    <TableCell>{user.roles.join(", ")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-6">
              <Empty className="border-border bg-muted/30">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Users className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>No users found</EmptyTitle>
                  <EmptyDescription>
                    Adjust filters or seed more directory records.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>
          Page {users.data?.meta.page ?? filters.page} of{" "}
          {users.data?.meta.totalPages ?? 1}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page <= 1}
            onClick={() =>
              void setFilters({ page: Math.max(1, filters.page - 1) })
            }
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={
              (users.data?.meta.totalPages ?? filters.page) <= filters.page
            }
            onClick={() => void setFilters({ page: filters.page + 1 })}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
