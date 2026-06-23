export interface StartSsoLoginCommand {
  provider: string;
  redirectUri: string;
  testEmail?: string;
}

export interface HandleSsoCallbackCommand {
  provider: string;
  code: string;
  state: string;
}
