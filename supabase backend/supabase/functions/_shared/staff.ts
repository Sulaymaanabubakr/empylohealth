export const EMPLOYEE_ROLES = ["admin", "editor", "viewer", "moderator", "support", "finance"] as const;

const permissionMap: Record<string, string[]> = {
  admin: [
    "users.view",
    "users.manage",
    "users.delete",
    "employees.manage",
    "content.view",
    "content.edit",
    "content.delete",
    "audit.view",
    "moderation.view",
    "moderation.resolve",
    "support.view",
    "support.manage",
    "transactions.view",
  ],
  editor: ["content.view", "content.edit"],
  viewer: ["content.view", "users.view", "audit.view"],
  moderator: ["moderation.view", "moderation.resolve", "users.view"],
  support: ["support.view", "support.manage", "users.view"],
  finance: ["transactions.view", "audit.view"],
};

export const isEmployeeRole = (role: string) =>
  EMPLOYEE_ROLES.includes(role as (typeof EMPLOYEE_ROLES)[number]);

export const defaultPermissionsForRole = (role: string) => permissionMap[role] || [];
