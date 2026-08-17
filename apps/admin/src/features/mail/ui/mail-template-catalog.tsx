"use client";

import { Badge } from "@repo/web-ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/web-ui/card";
import { ErrorState } from "@repo/web-ui/error-state";
import { SectionLoading } from "@repo/web-ui/loading";
import { Show } from "@repo/web-ui/show";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/web-ui/table";

import type { MailViewModel } from "@/features/mail/model/mail.types";

interface MailTemplateCatalogProps {
  catalog: MailViewModel["templateCatalog"];
}

export function MailTemplateCatalog({ catalog }: MailTemplateCatalogProps) {
  const { isLoading, isError, onRetry, items, onSelect } = catalog;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Template catalog</CardTitle>
        <CardDescription className="text-xs">
          {items.length > 0
            ? `${items.length} templates available`
            : "All registered mail templates."}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 pb-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Mandatory</TableHead>
              <TableHead>Sendable</TableHead>
              <TableHead>Variables</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Show when={isLoading}>
              <TableRow>
                <TableCell colSpan={4} className="py-16 text-center">
                  <SectionLoading />
                </TableCell>
              </TableRow>
            </Show>
            {!isLoading && isError ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8">
                  <ErrorState
                    variant="inline"
                    className="m-0"
                    title="Could not load templates."
                    action={{ label: "Retry", onClick: onRetry }}
                  />
                </TableCell>
              </TableRow>
            ) : null}
            {!isLoading && !isError && items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-16 text-center text-sm text-muted-foreground">
                  No templates found.
                </TableCell>
              </TableRow>
            ) : null}
            {!isLoading && !isError
              ? items.map((tmpl) => (
                  <TableRow
                    key={tmpl.key}
                    className="cursor-pointer"
                    onClick={() => onSelect(tmpl.key)}
                  >
                    <TableCell className="font-mono text-xs">{tmpl.key}</TableCell>
                    <TableCell>
                      {tmpl.mandatory ? (
                        <Badge
                          variant="outline"
                          className="border-border text-xs text-accent-foreground"
                        >
                          Yes
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">No</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {tmpl.sendable ? (
                        <Badge variant="default" className="bg-primary/15 text-xs text-primary">
                          Yes
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {tmpl.variables.length > 0 ? tmpl.variables.join(", ") : "\u2014"}
                    </TableCell>
                  </TableRow>
                ))
              : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
