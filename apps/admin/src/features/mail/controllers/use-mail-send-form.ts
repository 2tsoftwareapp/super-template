"use client";

import { useCallback, useMemo, useState } from "react";

import type { MailTemplateDto } from "@/lib/api-types";

import { useSendMailMutation } from "@/features/mail/api/mail.mutations";

export function useMailSendForm(templates: MailTemplateDto[] | undefined) {
  const [sendTemplateKey, setSendTemplateKey] = useState("");
  const [sendRecipient, setSendRecipient] = useState("");
  const [variableValues, setVariableValues] = useState<
    Record<string, string>
  >({});
  const [sendIdempotencyKey, setSendIdempotencyKey] = useState("");

  const selectedTemplate = useMemo(
    () =>
      sendTemplateKey
        ? (templates ?? []).find((t) => t.key === sendTemplateKey)
        : undefined,
    [sendTemplateKey, templates],
  );

  const handleTemplateChange = useCallback(
    (key: string) => {
      setSendTemplateKey(key);
      const tmpl = (templates ?? []).find((t) => t.key === key);
      setVariableValues(
        Object.fromEntries((tmpl?.variables ?? []).map((v) => [v, ""])),
      );
    },
    [templates],
  );

  const resetForm = useCallback(() => {
    setSendTemplateKey("");
    setSendRecipient("");
    setVariableValues({});
    setSendIdempotencyKey("");
  }, []);

  const sendMail = useSendMailMutation({
    onSuccess: resetForm,
  });

  const handleSend = useCallback(() => {
    sendMail.mutate({
      templateKey: sendTemplateKey,
      to: sendRecipient,
      variables: variableValues,
      ...(sendIdempotencyKey
        ? { idempotencyKey: sendIdempotencyKey }
        : {}),
    });
  }, [sendMail, sendTemplateKey, sendRecipient, variableValues, sendIdempotencyKey]);

  return {
    selectedTemplateKey: sendTemplateKey,
    recipient: sendRecipient,
    variableValues,
    idempotencyKey: sendIdempotencyKey,
    selectedTemplate,
    sendableTemplates: (templates ?? []).filter((t) => t.sendable),
    onChangeTemplate: handleTemplateChange,
    onChangeRecipient: setSendRecipient,
    onVariableChange: (name: string, value: string) => {
      setVariableValues((prev) => ({ ...prev, [name]: value }));
    },
    onChangeIdempotencyKey: setSendIdempotencyKey,
    onSend: handleSend,
    isPending: sendMail.isPending,
    canSend: Boolean(sendTemplateKey && sendRecipient),
  };
}
