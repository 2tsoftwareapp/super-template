import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="outline" className="w-fit">
          Settings
        </Badge>
        <h1 className="text-4xl font-semibold">System settings</h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          Placeholder for admin-only configuration in the separate Vite app.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Next steps</CardTitle>
          <CardDescription>
            Add settings, audit, jobs, and import screens here.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This app is intentionally split away from the Next.js client web.
        </CardContent>
      </Card>
    </div>
  );
}
