"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";

import type { ApiEnvelope, OrganizationDto } from "@/lib/api-types";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { webFetch } from "@/lib/http";
import { cn } from "@/lib/utils";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type CreateFormValues = z.infer<typeof createSchema>;

function RoleBadge({ role }: { role: OrganizationDto["role"] }) {
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

export default function OrganizationsPage() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const organizations = useQuery({
    queryKey: ["organizations"],
    queryFn: () =>
      webFetch<ApiEnvelope<OrganizationDto[]>>("/api/bff/organizations"),
  });

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "" },
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateFormValues) =>
      webFetch<ApiEnvelope<OrganizationDto>>("/api/bff/organizations", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success("Organization created");
      setOpen(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="max-w-3xl space-y-6">
      <Card className="border-border">
        <CardHeader className="space-y-3">
          <Badge variant="outline" className="w-fit">
            Organizations
          </Badge>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-4xl">Organizations</CardTitle>
              <CardDescription>
                Manage your organizations and team members.
              </CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" />Create</Button>} />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create organization</DialogTitle>
                  <DialogDescription>
                    Create a new organization to collaborate with your team.
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={form.handleSubmit((values) =>
                    createMutation.mutate(values),
                  )}
                >
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Organization name</Label>
                      <Input
                        id="name"
                        placeholder="Acme Corp"
                        {...form.register("name")}
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.name.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? "Creating..." : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {organizations.isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="size-5 text-primary" />
            </div>
          ) : organizations.isError ? (
            <p className="text-sm text-destructive">
              {organizations.error.message}
            </p>
          ) : !organizations.data || organizations.data.data.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Building2 className="size-12 text-muted-foreground/40" />
              <div>
                <p className="text-lg font-medium">No organizations yet</p>
                <p className="text-sm text-muted-foreground">
                  Create your first organization to get started.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {organizations.data!.data.map((org) => (
                <Link key={org.id} href={`/organizations/${org.id}`}>
                  <div className="group flex items-center justify-between rounded-xl border border-border p-4 transition hover:bg-muted/50 hover:shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building2 className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium group-hover:text-primary">
                            {org.name}
                          </p>
                          {org.current && (
                            <Badge variant="secondary" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {org.slug}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <RoleBadge role={org.role} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
