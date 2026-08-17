"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Button } from "@repo/web-ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/web-ui/card";
import { Label } from "@repo/web-ui/label";
import { PasswordInput } from "@repo/web-ui/password-input";
import { Spinner } from "@repo/web-ui/spinner";
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
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Change password</CardTitle>
        <CardDescription>Update your password to keep your account secure.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <PasswordInput
              id="currentPassword"
              autoComplete="current-password"
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
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isSaving}>
            {isSaving && <Spinner className="mr-2 size-4" />}
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
