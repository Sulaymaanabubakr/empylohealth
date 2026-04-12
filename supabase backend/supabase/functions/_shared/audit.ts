import { supabaseAdmin } from "./supabase.ts";

type AuditInput = {
  userId?: string | null;
  action: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export const writeAuditLog = async ({
  userId = null,
  action,
  metadata = {},
  ipAddress = null,
  userAgent = null,
}: AuditInput) => {
  const { error } = await supabaseAdmin.from("audit_logs").insert({
    user_id: userId,
    action,
    metadata,
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  if (error) {
    console.error("[audit] failed", { action, error: error.message });
  }
};
