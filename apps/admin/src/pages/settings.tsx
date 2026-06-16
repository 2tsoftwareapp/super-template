import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Spinner } from "../components/ui/spinner";
import { PageHeader } from "../components/page-header";
import { webFetch } from "../lib/http";
import type { ApplicationSettingDto, ListResponse } from "../lib/types";

function displayValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export function SettingsPage() {
  const queryClient = useQueryClient();
  const settings = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => webFetch<ListResponse<ApplicationSettingDto>>("/api/v1/admin/settings"),
  });
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});

  const updateSetting = useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) =>
      webFetch<{ data: ApplicationSettingDto }>(`/api/v1/admin/settings/${key}`, {
        method: "PATCH",
        body: JSON.stringify({ value }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        label="Settings"
        title="System settings"
        description="Update application settings directly from the admin workspace."
      />
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configuration</CardTitle>
          <CardDescription className="text-xs">
            {settings.data
              ? `${settings.data.data.length} settings`
              : "Persisted settings returned by the API."}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          {settings.isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="size-5" />
            </div>
          ) : (settings.data?.data ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No settings found.</p>
          ) : (
            <div className="space-y-4">
              {(settings.data?.data ?? []).map((setting) => {
                const isObject = typeof setting.value === "object" && setting.value !== null;
                return (
                  <div key={setting.key} className="rounded-xl border border-border p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1.5 min-w-0">
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                          {setting.key}
                        </code>
                        {isObject ? (
                          <pre className="mt-1 max-h-20 overflow-auto rounded bg-muted/40 px-2 py-1.5 text-xs text-muted-foreground">
                            {displayValue(setting.value)}
                          </pre>
                        ) : (
                          <p className="text-sm text-muted-foreground">{displayValue(setting.value)}</p>
                        )}
                      </div>
                      <div className="flex w-full shrink-0 flex-col gap-2 md:max-w-xs">
                        <Label htmlFor={`setting-${setting.key}`} className="text-xs">
                          Override value
                        </Label>
                        <Input
                          id={`setting-${setting.key}`}
                          value={draftValues[setting.key] ?? JSON.stringify(setting.value)}
                          onChange={(e) =>
                            setDraftValues((prev) => ({
                              ...prev,
                              [setting.key]: e.target.value,
                            }))
                          }
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const next = safeJsonParse(
                              draftValues[setting.key] ?? JSON.stringify(setting.value),
                            );
                            void updateSetting.mutateAsync({ key: setting.key, value: next });
                          }}
                          disabled={updateSetting.isPending}
                        >
                          {updateSetting.isPending ? <Spinner className="size-3.5" /> : "Save"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function safeJsonParse(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
}
