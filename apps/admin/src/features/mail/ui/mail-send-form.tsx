"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Input } from "@repo/web-ui/input";
import { Label } from "@repo/web-ui/label";
import { LoadingButton } from "@repo/web-ui/loading-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/web-ui/select";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import type { MailTemplateDto } from "@/lib/api-types";

import { type SendMailFormValues, sendMailSchema } from "../model/mail.schemas";

export function MailSendForm({
  templates = [],
  isPending,
  onSubmit,
}: {
  templates: MailTemplateDto[];
  isPending: boolean;
  onSubmit: (values: SendMailFormValues) => void;
}) {
  const safeTemplates = templates ?? [];
  const sendableTemplates = safeTemplates.filter((t) => t.sendable);

  const form = useForm<SendMailFormValues>({
    resolver: zodResolver(sendMailSchema),
    defaultValues: {
      templateKey: sendableTemplates[0]?.key ?? "",
      to: "",
      variables: {},
    },
  });

  const selectedTemplateKey = useWatch<SendMailFormValues, "templateKey">({
    control: form.control,
    name: "templateKey",
  });
  const selectedTemplate = sendableTemplates.find((t) => t.key === selectedTemplateKey);

  useEffect(() => {
    form.setValue(
      "variables",
      Object.fromEntries((selectedTemplate?.variables ?? []).map((v) => [v, ""])),
    );
  }, [selectedTemplate, form]);

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="send-template" className="text-xs">
            Template
          </Label>
          <Select
            value={selectedTemplateKey}
            disabled={sendableTemplates.length === 0}
            onValueChange={(val) => {
              form.setValue("templateKey", val, { shouldValidate: true, shouldDirty: true });
            }}
          >
            <SelectTrigger id="send-template" className="w-full">
              <SelectValue placeholder="Select template…" />
            </SelectTrigger>
            <SelectContent>
              {sendableTemplates.map((t) => (
                <SelectItem key={t.key} value={t.key}>
                  {t.key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {sendableTemplates.length === 0 && (
            <p className="text-[10px] text-muted-foreground">No sendable templates available.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="send-to" className="text-xs">
            Recipient
          </Label>
          <Input
            id="send-to"
            placeholder="user@example.com"
            className="h-9"
            aria-invalid={Boolean(form.formState.errors.to)}
            {...form.register("to")}
          />
          {form.formState.errors.to && (
            <p className="text-[10px] text-destructive">{form.formState.errors.to.message}</p>
          )}
        </div>
      </div>

      {selectedTemplate?.variables && selectedTemplate.variables.length > 0 && (
        <div className="space-y-2 rounded-lg border border-border/80 bg-muted/20 p-3">
          <p className="text-xs font-medium text-foreground">Template variables</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {selectedTemplate.variables.map((variable) => (
              <div key={variable} className="space-y-1">
                <Label htmlFor={`var-${variable}`} className="font-mono text-[10px]">
                  {variable}
                </Label>
                <Input
                  id={`var-${variable}`}
                  placeholder={`Value for ${variable}`}
                  className="h-8 text-xs font-mono"
                  {...form.register(`variables.${variable}`)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <LoadingButton
        type="submit"
        size="sm"
        loading={isPending}
        disabled={sendableTemplates.length === 0}
      >
        Send email
      </LoadingButton>
    </form>
  );
}
