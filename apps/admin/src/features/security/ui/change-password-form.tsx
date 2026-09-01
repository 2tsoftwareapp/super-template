"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Button } from "@repo/web-ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/web-ui/card";
import { Label } from "@repo/web-ui/label";
import { PasswordInput } from "@repo/web-ui/password-input";
import { Spinner } from "@repo/web-ui/spinner";
import { KeyRound, Lock } from "lucide-react";
import { useForm } from "react-hook-form";

import {
  type ChangePasswordFormValues,
  changePasswordSchema,
} from "@/features/security/model/security.schemas";

export function ChangePasswordForm({
  onChangePassword,
  isSaving,
}: {
  onChangePassword: (values: ChangePasswordFormValues) => void;
  isSaving: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: ChangePasswordFormValues) => {
    onChangePassword(values);
    reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <KeyRound className="size-5 text-primary" />
          Change password
        </CardTitle>
        <CardDescription>
          Update your account password. Use at least 8 characters with a mix of letters, numbers,
          and symbols.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <PasswordInput
              id="currentPassword"
              autoComplete="current-password"
              placeholder="Enter current password"
              {...register("currentPassword")}
            />
            {errors.currentPassword && (
              <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <PasswordInput
              id="newPassword"
              autoComplete="new-password"
              placeholder="Enter new password (min. 8 characters)"
              {...register("newPassword")}
            />
            {errors.newPassword && (
              <p className="text-xs text-destructive">{errors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              placeholder="Re-enter new password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isSaving} className="mt-2">
            {isSaving ? <Spinner className="mr-2 size-4" /> : <Lock className="mr-1.5 size-4" />}
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
