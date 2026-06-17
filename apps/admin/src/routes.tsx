import { Navigate, Route, Routes } from "react-router-dom";

import { AdminShell } from "./components/admin-shell";
import { AuditLogsPage } from "./pages/audit-logs";
import { DashboardPage } from "./pages/dashboard";
import { ImportsPage } from "./pages/imports";
import { JobsPage } from "./pages/jobs";
import { LoginPage } from "./pages/login";
import { MailPage } from "./pages/mail";
import { NotificationsPage } from "./pages/notifications";
import { ProjectDetailPage } from "./pages/project-detail";
import { ProjectEditPage } from "./pages/project-edit";
import { ProjectsPage } from "./pages/projects";
import { RolesPage } from "./pages/roles";
import { SettingsPage } from "./pages/settings";
import { UserDetailPage } from "./pages/user-detail";
import { UsersPage } from "./pages/users";

export function AdminRouter() {
  return (
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
  );
}
