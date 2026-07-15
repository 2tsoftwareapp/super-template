export const organizationsKeys = {
  my: ["admin-my-organizations"] as const,
  all: ["admin-organizations"] as const,
  detail: (id: string) => ["admin-organizations", "detail", id] as const,
  members: (id: string) => ["admin-organizations", "members", id] as const,
};
