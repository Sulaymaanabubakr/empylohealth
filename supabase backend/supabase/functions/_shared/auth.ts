import { errorResponse } from "./response.ts";
import { supabaseAdmin } from "./supabase.ts";

export const getBearerToken = (req: Request) => {
  const authorization = req.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    return null;
  }
  return authorization.slice(7).trim() || null;
};

export const requireUser = async (req: Request) => {
  const token = getBearerToken(req);
  if (!token) {
    throw errorResponse(401, "Missing bearer token.");
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    throw errorResponse(401, "Invalid or expired token.");
  }

  return { token, user: data.user };
};
