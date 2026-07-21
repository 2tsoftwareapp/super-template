export type VerifyEmailStatus = "verifying" | "success" | "error";

export interface VerifyEmailViewModel {
  status: VerifyEmailStatus;
  message: string;
}
