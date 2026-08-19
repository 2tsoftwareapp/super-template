export const mailKeys = {
  all: ["admin-mail"] as const,
  templates: () => [...mailKeys.all, "templates"] as const,
  lists: () => [...mailKeys.all, "deliveries"] as const,
  list: (params: Record<string, unknown>) => [...mailKeys.lists(), params] as const,
  preview: (key: string) => [...mailKeys.all, "preview", key] as const,
};
