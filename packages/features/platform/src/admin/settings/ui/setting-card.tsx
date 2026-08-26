"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Button } from "@repo/web-ui/button";
import { Checkbox } from "@repo/web-ui/checkbox";
import { Input } from "@repo/web-ui/input";
import { Label } from "@repo/web-ui/label";
import { LoadingButton } from "@repo/web-ui/loading-button";
import { RotateCcw } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import type { ApplicationSettingDto } from "@repo/web-utils/api-types";

import type { SettingValue } from "../model/settings.types";

import { displayValue, initDraft, isObjectValue } from "../model/settings-drafts";
import {
  type SettingObjectInput,
  settingObjectInputSchema,
  type SettingScalarInput,
  settingScalarInputSchema,
} from "../model/settings.schemas";

function ScalarSettingCard({
  setting,
  isSaving,
  onSave,
}: {
  setting: ApplicationSettingDto;
  isSaving: boolean;
  onSave: (key: string, value: SettingValue) => void;
}) {
  const form = useForm<SettingScalarInput>({
    resolver: zodResolver(settingScalarInputSchema),
    defaultValues: {
      value: initDraft(setting.value),
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    const parsed = settingScalarInputSchema.parse(values);
    const next = JSON.parse(parsed.value) as SettingValue;
    onSave(setting.key, next);
    form.reset({ value: initDraft(setting.value) });
  });

  return (
    <form className="flex gap-1.5" onSubmit={handleSubmit}>
      <Input
        id={`setting-${setting.key}`}
        aria-invalid={Boolean(form.formState.errors.value)}
        {...form.register("value")}
      />
      {form.formState.errors.value ? (
        <p className="text-xs text-destructive">{form.formState.errors.value.message}</p>
      ) : null}
      {form.formState.isDirty && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => form.reset({ value: initDraft(setting.value) })}
        >
          <RotateCcw className="size-3.5" />
        </Button>
      )}
      {form.formState.isDirty && (
        <LoadingButton type="submit" variant="outline" size="sm" loading={isSaving}>
          Save
        </LoadingButton>
      )}
    </form>
  );
}

function ObjectSettingCard({
  setting,
  isSaving,
  onSave,
}: {
  setting: ApplicationSettingDto;
  isSaving: boolean;
  onSave: (key: string, value: SettingValue) => void;
}) {
  const objValue = isObjectValue(setting.value)
    ? (setting.value as Record<string, string | boolean | number | null>)
    : {};

  const form = useForm<SettingObjectInput>({
    resolver: zodResolver(settingObjectInputSchema),
    defaultValues: {
      fields: Object.fromEntries(
        Object.entries(objValue).map(([k, v]) => [k, typeof v === "boolean" ? v : String(v ?? "")]),
      ),
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    onSave(setting.key, values.fields);
    form.reset({ fields: { ...values.fields } });
  });

  return (
    <form className="space-y-2" onSubmit={handleSubmit}>
      <div className="space-y-2 rounded-lg border border-border p-3">
        {Object.entries(objValue).map(([k, v]) => (
          <div key={k}>
            {typeof v === "boolean" ? (
              <Controller
                control={form.control}
                name={`fields.${k}`}
                render={({ field }) => (
                  <label className="flex cursor-pointer items-center gap-2">
                    <Checkbox checked={Boolean(field.value)} onChange={field.onChange} />
                    <span className="text-sm">{k}</span>
                  </label>
                )}
              />
            ) : (
              <div className="space-y-1">
                <Label className="font-mono text-[11px] text-muted-foreground">{k}</Label>
                <Input
                  placeholder={v === null ? "null" : `Value for ${k}`}
                  {...form.register(`fields.${k}`)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      {form.formState.isDirty && (
        <div className="flex gap-1.5">
          <LoadingButton
            type="submit"
            variant="outline"
            size="sm"
            className="flex-1"
            loading={isSaving}
          >
            Save
          </LoadingButton>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => form.reset()}
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      )}
    </form>
  );
}

export function SettingCard({
  setting,
  canUpdate,
  isSaving,
  onSave,
}: {
  setting: ApplicationSettingDto;
  canUpdate: boolean;
  isSaving: boolean;
  onSave: (key: string, value: SettingValue) => void;
}) {
  const isObject = isObjectValue(setting.value);

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1 space-y-1.5">
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{setting.key}</code>
          {isObject ? (
            <pre className="mt-1 max-h-20 overflow-auto rounded bg-muted/40 px-2 py-1.5 text-xs text-muted-foreground">
              {displayValue(setting.value)}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">{displayValue(setting.value)}</p>
          )}
        </div>
        {canUpdate ? (
          <div className="flex w-full shrink-0 flex-col gap-2 md:max-w-xs">
            <Label htmlFor={`setting-${setting.key}`} className="text-xs">
              Override value
            </Label>
            {isObject ? (
              <ObjectSettingCard setting={setting} isSaving={isSaving} onSave={onSave} />
            ) : (
              <ScalarSettingCard setting={setting} isSaving={isSaving} onSave={onSave} />
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
