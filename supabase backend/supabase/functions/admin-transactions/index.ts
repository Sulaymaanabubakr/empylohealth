import { requireAdmin } from "../_shared/admin.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { errorResponse, json } from "../_shared/response.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

const parseBody = async (req: Request) => {
  try {
    return await req.json();
  } catch {
    return {};
  }
};

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  if (req.method !== "POST") return errorResponse(405, "Method not allowed.", undefined, { headers: corsHeaders });

  try {
    await requireAdmin(req, { permission: "transactions.view", denialAction: "admin.transactions_denied" });
    const body = await parseBody(req);
    const limit = Math.min(Math.max(Number(body?.limit || 50), 1), 200);

    const { data, error } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;

    const items = (data || []).map((transaction) => ({
      id: transaction.id,
      customerName: transaction.customer_name,
      email: transaction.email,
      amount: Number(transaction.amount || 0),
      status: transaction.status,
      createdAt: transaction.created_at,
      type: transaction.type,
      user: transaction.customer_name || transaction.email,
    }));

    return json({ items }, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to load transactions.", undefined, { headers: corsHeaders });
  }
});
