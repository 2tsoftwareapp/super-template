import type { Request as ExpressRequest } from "express";

import {
  type CanActivate,
  type ExecutionContext,
  HttpStatus,
  Inject,
  Injectable,
} from "@nestjs/common";
import { AppError, ERROR_CODES } from "@repo/api-runtime";
import {
  APPLICATION_SETTINGS_LOOKUP,
  type ApplicationSettingsLookup,
} from "@repo/feature-settings/contracts";

/**
 * Paths that must stay reachable while maintenance mode is enabled so the
 * platform can be brought back up: liveness/readiness probes, the sign-in
 * flow (admins need to log in to reach settings), and the settings endpoints
 * themselves (the switch that turns maintenance off).
 */
const MAINTENANCE_EXEMPT_PATHS = [
  "/api/v1/health",
  "/api/v1/auth/login",
  "/api/v1/auth/sso",
  "/api/v1/admin/settings",
] as const;

@Injectable()
export class MaintenanceModeGuard implements CanActivate {
  constructor(
    @Inject(APPLICATION_SETTINGS_LOOKUP)
    private readonly applicationSettingsLookup: ApplicationSettingsLookup,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ExpressRequest>();

    if (MAINTENANCE_EXEMPT_PATHS.some((path) => request.path.startsWith(path))) {
      return true;
    }

    if (!(await this.applicationSettingsLookup.isMaintenanceMode())) {
      return true;
    }

    throw new AppError(
      ERROR_CODES.SERVICE_UNAVAILABLE,
      "Service is under maintenance, please try again later",
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
