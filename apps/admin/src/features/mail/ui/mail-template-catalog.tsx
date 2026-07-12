"use client";

import { Badge } from "@repo/web-core/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/web-core/components/card";
import { SectionLoading } from "@repo/web-core/components/loading";
import { Show } from "@repo/web-core/components/show";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/web-core/components/table";

import type { MailTemplateDto } from "@/lib/api-types";

interface MailTemplateCatalogProps {
  isLoading: boolean;
  items: MailTemplateDto[];
  onSelect: (key: string) => void;
}

export function MailTemplateCatalog({
  isLoading,
  items,
  onSelect,
}: MailTemplateCatalogProps) {
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
            {!isLoading && items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-16 text-center text-sm text-muted-foreground"
                >
                  No templates found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((tmpl) => (
                <TableRow
                  key={tmpl.key}
                  className="cursor-pointer"
                  onClick={() => onSelect(tmpl.key)}
                >
                  <TableCell className="font-mono text-xs">
                    {tmpl.key}
                  </TableCell>
                  <TableCell>
                    {tmpl.mandatory ? (
                      <Badge
                        variant="outline"
                        className="text-xs text-accent-foreground border-border"
                      >
                        Yes
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {tmpl.sendable ? (
                      <Badge
                        variant="default"
                        className="text-xs bg-primary/15 text-primary"
                      >
                        Yes
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {tmpl.variables.length > 0
                      ? tmpl.variables.join(", ")
                      : "\u2014"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
