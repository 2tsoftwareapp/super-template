export const mailKeys = {
  templates: ["admin-mail-templates"] as const,
  deliveries: (params: Record<string, unknown>) => ["admin-mail-deliveries", "list", params] as const,
  preview: (key: string) => ["admin-mail-preview", key] as const,
};
