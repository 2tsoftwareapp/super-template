import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { PageHeader } from "../components/page-header";
import { webFetch } from "../lib/http";
import type { ListResponse, MailDeliveryDto, MailPreviewDto } from "../lib/types";

export function MailPage() {
  const [templateKey, setTemplateKey] = useState("welcome");
  const deliveries = useQuery({
    queryKey: ["admin-mail-deliveries"],
    queryFn: () => webFetch<ListResponse<MailDeliveryDto>>("/api/v1/admin/mail/deliveries?limit=50"),
  });
  const preview = useQuery({
    queryKey: ["admin-mail-preview", templateKey],
    queryFn: () => webFetch<{ data: MailPreviewDto }>(`/api/v1/admin/mail/preview/${encodeURIComponent(templateKey)}`),
    enabled: Boolean(templateKey),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        label="Mail"
        title="Mail workspace"
        description="Review delivery history and render templates through the API."
      />
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Template preview</CardTitle>
            <CardDescription>Look up a template key and inspect subject/text/html.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input value={templateKey} onChange={(event) => setTemplateKey(event.target.value)} />
            <Button variant="outline" onClick={() => void preview.refetch()}>
              Refresh preview
            </Button>
            <div className="rounded-2xl border border-border p-4 text-sm">
              <p className="font-medium">{preview.data?.data.subject ?? "No preview yet"}</p>
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{preview.data?.data.text ?? "Enter a template key."}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Deliveries</CardTitle>
            <CardDescription>History from the mail delivery endpoint.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(deliveries.data?.data ?? []).map((delivery) => (
              <div key={delivery.id} className="rounded-2xl border border-border p-4">
                <p className="font-medium">{delivery.subject}</p>
                <p className="text-sm text-muted-foreground">
                  {delivery.recipient} · {delivery.status}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
