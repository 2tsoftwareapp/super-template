"use client";
import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/web-ui/card";
import { Input } from "@repo/web-ui/input";
import { Label } from "@repo/web-ui/label";
import { Spinner } from "@repo/web-ui/spinner";
import { getErrorMessage } from "@repo/web-utils/errors";
import { Building, Users } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useUpdateOrganizationMutation } from "@/features/organizations/api/organizations.mutations";
import { useOrganizationDetailQuery } from "@/features/organizations/api/organizations.queries";
import { type CreateOrganizationForm, createOrganizationSchema } from "@/features/organizations/model/organizations.schemas";
import { useSession } from "@/hooks/use-session";
import { Link } from "@/i18n/navigation";

export function OrganizationSettingsView() {
  const session = useSession();
  const organizationId = session.data?.data.organizationId;

  const detailQuery = useOrganizationDetailQuery(organizationId ?? "");
  const updateOrg = useUpdateOrganizationMutation(organizationId ?? "");

  const form = useForm<CreateOrganizationForm>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (detailQuery.data?.data) {
      form.setValue("name", detailQuery.data.data.name);
    }
  }, [detailQuery.data, form]);

  const handleSubmit = form.handleSubmit((values) => {
    updateOrg.mutate(
      { name: values.name },
      {
        onSuccess: () => {
          toast.success("Organization updated successfully");
        },
        onError: (error) => {
          toast.error(getErrorMessage(error));
        },
      },
    );
  });

  if (!organizationId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="size-4" />
              Organization
            </CardTitle>
            <CardDescription>Manage your organization profile and settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You are not currently associated with an organization.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="size-4" />
              Organization
            </CardTitle>
            <CardDescription>Loading organization settings...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Spinner className="size-4" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="size-4" />
            Organization
          </CardTitle>
          <CardDescription>Manage your organization profile and settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="grid max-w-md gap-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization name</Label>
              <Input
                id="orgName"
                placeholder="e.g. Acme Corp"
                aria-invalid={Boolean(form.formState.errors.name)}
                disabled={updateOrg.isPending}
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgSlug">Slug</Label>
              <Input
                id="orgSlug"
                type="text"
                value={detailQuery.data?.data?.slug ?? ""}
                disabled
                className="bg-muted opacity-60"
              />
              <p className="text-[11px] text-muted-foreground">
                The slug is used in URLs and cannot be changed.
              </p>
            </div>
            <div>
              <button
                type="submit"
                disabled={updateOrg.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {updateOrg.isPending && <Spinner className="size-3" />}
                Save Changes
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4" />
            Team Members
          </CardTitle>
          <CardDescription>Manage who has access to this organization.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Visit the{" "}
            <Link href="/organizations" className="text-primary underline underline-offset-4">
              Organizations
            </Link>{" "}
            page to manage members and roles.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
