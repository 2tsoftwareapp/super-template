export const IMPORT_TYPES = [
  { value: "users", label: "Users" },
  { value: "projects", label: "Projects" },
] as const;

export const DEFAULT_IMPORT_TYPE = IMPORT_TYPES[0].value;
