"use client";

import { getErrorMessage } from "@repo/web-utils/errors";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

import type { SendMailFormValues } from "@/features/mail/model/mail.schemas";
import type { MailTemplateDto } from "@/lib/api-types";

import { useSendMailMutation } from "@/features/mail/api/mail.mutations";

export function useMailSendForm(templates: MailTemplateDto[] | undefined, canAccess: boolean) {
  const sendableTemplates = useMemo(() => (templates ?? []).filter((t) => t.sendable), [templates]);

  const sendMail = useSendMailMutation({
    onSuccess: () => {
      toast.success("Test mail queued.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleSend = useCallback(
    (values: SendMailFormValues) => {
      if (!canAccess) return;
      sendMail.mutate({
        templateKey: values.templateKey,
        to: values.to,
        variables: values.variables,
        ...(values.idempotencyKey ? { idempotencyKey: values.idempotencyKey } : {}),
      });
    },
    [canAccess, sendMail],
  );

  return {
    canAccess,
    sendableTemplates,
    isPending: sendMail.isPending,
    onSend: handleSend,
  };
}
