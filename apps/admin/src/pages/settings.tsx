import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { PageHeader } from "../components/page-header";
import { webFetch } from "../lib/http";
import type { ApplicationSettingDto, ListResponse } from "../lib/types";

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
        <CardHeader>
          <CardTitle className="text-xl">Configuration</CardTitle>
          <CardDescription>Persisted settings returned by the API.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(settings.data?.data ?? []).map((setting) => (
            <div key={setting.key} className="rounded-2xl border border-border p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{setting.key}</p>
                  <p className="text-sm text-muted-foreground">
                    {typeof setting.value === "object"
                      ? JSON.stringify(setting.value)
                      : String(setting.value)}
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 md:max-w-md">
                  <Label htmlFor={`setting-${setting.key}`}>Override value</Label>
                  <Input
                    id={`setting-${setting.key}`}
                    value={draftValues[setting.key] ?? JSON.stringify(setting.value)}
                    onChange={(event) =>
                      setDraftValues((current) => ({
                        ...current,
                        [setting.key]: event.target.value,
                      }))
                    }
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    const nextValue = safeJsonParse(
                      draftValues[setting.key] ?? JSON.stringify(setting.value),
                    );
                    void updateSetting.mutateAsync({
                      key: setting.key,
                      value: nextValue,
                    });
                  }}
                  disabled={updateSetting.isPending}
                >
                  Save
                </Button>
              </div>
            </div>
          ))}
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
