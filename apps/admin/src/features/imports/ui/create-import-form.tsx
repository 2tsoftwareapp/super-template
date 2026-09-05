"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Input } from "@repo/web-ui/input";
import { Label } from "@repo/web-ui/label";
import { LoadingButton } from "@repo/web-ui/loading-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/web-ui/select";
import { useForm } from "react-hook-form";

import type { IMPORT_TYPES } from "../model/imports.constants";

import { type CreateImportFormValues, createImportSchema } from "../model/imports.schemas";

export function CreateImportForm({
  importTypes,
  canCreate,
  isCreating,
  onSubmit,
}: {
  importTypes: typeof IMPORT_TYPES;
  canCreate: boolean;
  isCreating: boolean;
  onSubmit: (values: CreateImportFormValues) => void;
}) {
  const form = useForm<CreateImportFormValues>({
    resolver: zodResolver(createImportSchema),
    defaultValues: {
      fileId: "",
      type: importTypes[0]?.value ?? "",
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values);
  });

  return (
    <form id="create-import-form" className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="import-file-id">File ID</Label>
        <Input
          id="import-file-id"
          placeholder="UUID of the uploaded file"
          aria-invalid={Boolean(form.formState.errors.fileId)}
          disabled={!canCreate}
          {...form.register("fileId")}
        />
        {form.formState.errors.fileId ? (
          <p className="text-xs text-destructive">{form.formState.errors.fileId.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="import-type">Type</Label>
        <Select
          value={form.watch("type")}
          disabled={!canCreate}
          onValueChange={(val) => {
            form.setValue("type", val, { shouldValidate: true, shouldDirty: true });
          }}
        >
          <SelectTrigger id="import-type" className="w-full">
            <SelectValue placeholder="Select type…" />
          </SelectTrigger>
          <SelectContent>
            {importTypes.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.type ? (
          <p className="text-xs text-destructive">{form.formState.errors.type.message}</p>
        ) : null}
      </div>
      {canCreate ? (
        <LoadingButton
          type="submit"
          className="w-full"
          disabled={!form.formState.isValid}
          loading={isCreating}
        >
          Create import
        </LoadingButton>
      ) : (
        <p className="text-xs text-muted-foreground">
          You do not have permission to create imports.
        </p>
      )}
    </form>
  );
}
