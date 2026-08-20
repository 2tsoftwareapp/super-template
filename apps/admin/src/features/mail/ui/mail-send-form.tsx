"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Input } from "@repo/web-ui/input";
import { Label } from "@repo/web-ui/label";
import { LoadingButton } from "@repo/web-ui/loading-button";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import type { MailTemplateDto } from "@/lib/api-types";

import { type SendMailFormValues, sendMailSchema } from "../model/mail.schemas";

export function MailSendForm({
  templates,
  isPending,
  onSubmit,
}: {
  templates: MailTemplateDto[];
  isPending: boolean;
  onSubmit: (values: SendMailFormValues) => void;
}) {
  const sendableTemplates = templates.filter((t) => t.sendable);

  const form = useForm<SendMailFormValues>({
    resolver: zodResolver(sendMailSchema),
    defaultValues: {
      templateKey: "",
      to: "",
      idempotencyKey: "",
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="send-template-key" className="text-xs text-muted-foreground">
            Template key
          </Label>
          <select
            id="send-template-key"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-invalid={Boolean(form.formState.errors.templateKey)}
            {...form.register("templateKey")}
          >
            <option value="">Select a template</option>
            {sendableTemplates.map((tmpl) => (
              <option key={tmpl.key} value={tmpl.key}>
                {tmpl.key}
              </option>
            ))}
          </select>
          {form.formState.errors.templateKey ? (
            <p className="text-xs text-destructive">{form.formState.errors.templateKey.message}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="send-recipient" className="text-xs text-muted-foreground">
            Recipient email
          </Label>
          <Input
            id="send-recipient"
            type="email"
            placeholder="user@example.com"
            aria-invalid={Boolean(form.formState.errors.to)}
            {...form.register("to")}
          />
          {form.formState.errors.to ? (
            <p className="text-xs text-destructive">{form.formState.errors.to.message}</p>
          ) : null}
        </div>
        {selectedTemplate?.variables && selectedTemplate.variables.length > 0 ? (
          <div className="space-y-3 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Variables</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {selectedTemplate.variables.map((varName) => (
                <div key={varName} className="space-y-1">
                  <Label className="font-mono text-[11px] text-muted-foreground">{varName}</Label>
                  <Input
                    placeholder={`Value for ${varName}`}
                    {...form.register(`variables.${varName}`)}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="send-idempotency-key" className="text-xs text-muted-foreground">
            Idempotency key (optional)
          </Label>
          <Input
            id="send-idempotency-key"
            placeholder="uuid or unique string"
            {...form.register("idempotencyKey")}
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <LoadingButton
          type="submit"
          size="sm"
          disabled={!form.formState.isValid}
          loading={isPending}
        >
          Send mail
        </LoadingButton>
      </div>
    </form>
  );
}
