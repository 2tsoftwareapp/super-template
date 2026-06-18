import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AdminShell } from "./components/admin-shell";
import { Spinner } from "./components/ui/spinner";

// Route-level code splitting: each page is loaded on demand so the initial
// bundle stays small. Pages use named exports, so map them to a default export
// for React.lazy.
const LoginPage = lazy(() =>
  import("./pages/login").then((m) => ({ default: m.LoginPage })),
);
const DashboardPage = lazy(() =>
  import("./pages/dashboard").then((m) => ({ default: m.DashboardPage })),
);
const UsersPage = lazy(() =>
  import("./pages/users").then((m) => ({ default: m.UsersPage })),
);
const UserDetailPage = lazy(() =>
  import("./pages/user-detail").then((m) => ({ default: m.UserDetailPage })),
);
const ProjectsPage = lazy(() =>
  import("./pages/projects").then((m) => ({ default: m.ProjectsPage })),
);
const ProjectDetailPage = lazy(() =>
  import("./pages/project-detail").then((m) => ({
    default: m.ProjectDetailPage,
  })),
);
const ProjectEditPage = lazy(() =>
  import("./pages/project-edit").then((m) => ({ default: m.ProjectEditPage })),
);
const AuditLogsPage = lazy(() =>
  import("./pages/audit-logs").then((m) => ({ default: m.AuditLogsPage })),
);
const NotificationsPage = lazy(() =>
  import("./pages/notifications").then((m) => ({
    default: m.NotificationsPage,
  })),
);
const JobsPage = lazy(() =>
  import("./pages/jobs").then((m) => ({ default: m.JobsPage })),
);
const MailPage = lazy(() =>
  import("./pages/mail").then((m) => ({ default: m.MailPage })),
);
const ImportsPage = lazy(() =>
  import("./pages/imports").then((m) => ({ default: m.ImportsPage })),
);
const RolesPage = lazy(() =>
  import("./pages/roles").then((m) => ({ default: m.RolesPage })),
);
const SettingsPage = lazy(() =>
  import("./pages/settings").then((m) => ({ default: m.SettingsPage })),
);

function RouteFallback() {
  return (
    <div className="flex h-full min-h-64 w-full items-center justify-center">
      <Spinner className="size-6 text-muted-foreground" />
    </div>
  );
}

export function AdminRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AdminShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:id" element={<UserDetailPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/projects/:id/edit" element={<ProjectEditPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/mail" element={<MailPage />} />
          <Route path="/imports" element={<ImportsPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
