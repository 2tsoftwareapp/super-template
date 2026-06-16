import { Navigate, Route, Routes } from "react-router-dom";
import { AdminShell } from "./components/admin-shell";
import { DashboardPage } from "./pages/dashboard";
import { LoginPage } from "./pages/login";
import { ProjectsPage } from "./pages/projects";
import { SettingsPage } from "./pages/settings";
import { UsersPage } from "./pages/users";

export function AdminRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AdminShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
