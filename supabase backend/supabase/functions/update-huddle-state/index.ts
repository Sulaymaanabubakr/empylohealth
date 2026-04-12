import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { errorResponse } from "../_shared/response.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  return errorResponse(501, "Use the explicit huddle endpoints instead.", undefined, { headers: corsHeaders });
});
