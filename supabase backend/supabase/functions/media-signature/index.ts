import { requireUser } from "../_shared/auth.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { errorResponse, json } from "../_shared/response.ts";

const parseBody = async (req: Request) => {
  try {
    return await req.json();
  } catch {
    return {};
  }
};

const encoder = new TextEncoder();

const sha1Hex = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-1", encoder.encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  if (req.method !== "POST") return errorResponse(405, "Method not allowed.", undefined, { headers: corsHeaders });

  try {
    await requireUser(req);
    const body = await parseBody(req);
    const folder = String(body?.folder || "resources").trim() || "resources";
    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME") || "";
    const apiKey = Deno.env.get("CLOUDINARY_API_KEY") || "";
    const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET") || "";

    if (!cloudName || !apiKey || !apiSecret) {
      return errorResponse(500, "Cloudinary secrets are missing.", undefined, { headers: corsHeaders });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const baseToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = await sha1Hex(baseToSign);

    return json({
      signature,
      timestamp,
      cloud_name: cloudName,
      api_key: apiKey,
    }, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to sign upload.", undefined, { headers: corsHeaders });
  }
});
