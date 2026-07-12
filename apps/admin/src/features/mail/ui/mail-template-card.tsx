"use client";

import { Button } from "@repo/web-core/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/web-core/components/card";
import { ErrorState } from "@repo/web-core/components/error-state";
import { Input } from "@repo/web-core/components/input";
import { SectionLoading } from "@repo/web-core/components/loading";
import { Separator } from "@repo/web-core/components/separator";
import { Show } from "@repo/web-core/components/show";
import { Spinner } from "@repo/web-core/components/spinner";

import type { MailPreviewDto } from "@/lib/api-types";

interface MailTemplateCardProps {
  preview: {
    templateKey: string;
    onChange: (key: string) => void;
    onPreview: () => void;
    isFetching: boolean;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    data: MailPreviewDto | undefined;
  };
}

export function MailTemplateCard({ preview }: MailTemplateCardProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Template preview</CardTitle>
        <CardDescription className="text-xs">
          Look up a template key and inspect subject / body.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            className="flex-1"
            value={preview.templateKey}
            onChange={(e) => preview.onChange(e.target.value)}
            placeholder="Template key (e.g. auth.welcome)"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={preview.onPreview}
            disabled={preview.isFetching}
          >
            {preview.isFetching ? (
              <Spinner className="size-3.5" />
            ) : (
              "Preview"
            )}
          </Button>
        </div>

        <div className="rounded-xl border border-border p-4 text-sm">
          <Show when={preview.isLoading}>
            <SectionLoading />
          </Show>
          <Show when={preview.isError}>
            <ErrorState
              variant="inline"
              title="Preview unavailable."
              description={
                preview.error instanceof Error
                  ? preview.error.message
                  : "The template key is invalid or the preview endpoint is unavailable."
              }
            />
          </Show>
          {!preview.isLoading && !preview.isError && preview.data ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Subject
              </p>
              <p className="mt-1 font-semibold">{preview.data.subject}</p>
              <Separator className="my-3" />
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                {preview.data.text}
              </p>
              {preview.data.missingVariables?.length > 0 && (
                <>
                  <Separator className="my-3" />
                  <p className="text-xs font-medium uppercase tracking-wide text-accent-foreground">
                    Missing variables
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {preview.data.missingVariables.join(", ")}
                  </p>
                </>
              )}
            </>
          ) : !preview.isLoading && !preview.isError ? (
            <p className="py-2 text-center text-xs text-muted-foreground">
              {preview.templateKey
                ? "Template not found."
                : "Enter a template key above."}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
