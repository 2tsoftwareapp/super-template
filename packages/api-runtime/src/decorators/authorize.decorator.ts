import { SetMetadata } from "@nestjs/common";

export const AUTHORIZE_KEY = "authorize";

export interface AuthorizeOptions {
  roles?: string[];
  permissions?: string[];
}

export const Authorize = (options: AuthorizeOptions) => SetMetadata(AUTHORIZE_KEY, options);
