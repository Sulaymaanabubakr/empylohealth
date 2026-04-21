import { requireUser } from "../_shared/auth.ts";
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

const normalizeTags = (value: unknown) => Array.isArray(value)
  ? value.map((item) => String(item || "").trim()).filter(Boolean)
  : [];

const mapResource = (item: Record<string, unknown>) => ({
  id: String(item.id || ""),
  title: String(item.title || ""),
  description: String(item.description || ""),
  content: String(item.content || ""),
  image: String(item.image || ""),
  category: String(item.category || ""),
  tag: String(item.tag || ""),
  time: String(item.time || ""),
  color: String(item.color || ""),
  status: String(item.status || ""),
  tags: normalizeTags(item.tags),
  themes: normalizeTags(item.tags),
  access: item.access || {},
});

const mapAffirmation = (item: Record<string, unknown>) => ({
  id: String(item.id || ""),
  content: String(item.content || ""),
  image: String(item.image || ""),
  tags: normalizeTags(item.tags),
  scheduledDate: item.scheduled_date || null,
  status: String(item.status || "active"),
});

const mapChallenge = (item: Record<string, unknown>) => ({
  id: String(item.id || ""),
  title: String(item.title || ""),
  description: String(item.description || ""),
  level: String(item.level || ""),
  icon: String(item.icon || ""),
  bg: String(item.bg || ""),
  color: String(item.color || ""),
  category: String(item.category || ""),
  priority: Number(item.priority || 0),
  tags: normalizeTags(item.tags),
});

const mapAiChallenge = (item: Record<string, unknown>) => ({
  id: String(item?.id || ""),
  runId: String(item?.run_id || ""),
  title: String(item?.title || ""),
  level: String(item?.level || "medium"),
  explanation: String(item?.explanation || ""),
  suggestions: Array.isArray(item?.suggestions) ? item.suggestions.map((s) => String(s || "")) : [],
  theme: String((item?.details as Record<string, unknown>)?.theme || ""),
  reason: String((item?.details as Record<string, unknown>)?.reason || ""),
  position: Number(item?.position || 0),
});

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  if (req.method !== "POST") return errorResponse(405, "Method not allowed.", undefined, { headers: corsHeaders });

  try {
    const body = await parseBody(req);
    const action = String(body?.action || "");
    const { user } = await requireUser(req);

    if (action === "getExploreContent") {
      const limit = Math.min(Math.max(Number(body?.limit || 40), 1), 100);
      const { data, error } = await supabaseAdmin
        .from("resources")
        .select("*")
        .eq("status", "active")
        .order("published_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return json({ items: (data || []).map((item) => mapResource(item as Record<string, unknown>)) }, { headers: corsHeaders });
    }

    if (action === "getAffirmations") {
      const today = new Date().toISOString().slice(0, 10);
      const { data: dailyRows } = await supabaseAdmin
        .from("daily_affirmations")
        .select("affirmation_id, slot_key")
        .eq("day_key", today);

      if (dailyRows?.length) {
        const orderedRows = [...dailyRows].sort((a, b) => {
          const order = { morning: 0, afternoon: 1, evening: 2 } as Record<string, number>;
          return (order[String(a.slot_key || "")] ?? 99) - (order[String(b.slot_key || "")] ?? 99);
        });
        const ids = Array.from(new Set(orderedRows.map((row) => row.affirmation_id).filter(Boolean)));
        const { data, error } = await supabaseAdmin
          .from("affirmations")
          .select("*")
          .in("id", ids)
          .eq("status", "active");
        if (error) throw error;
        const mappedById = new Map((data || []).map((item) => {
          const mapped = mapAffirmation(item as Record<string, unknown>);
          return [mapped.id, mapped];
        }));
        const scheduled = ids.map((id) => mappedById.get(String(id))).filter(Boolean);

        if (scheduled.length >= 3) {
          return json(scheduled.slice(0, 3), { headers: corsHeaders });
        }

        const { data: fallbackData, error: fallbackError } = await supabaseAdmin
          .from("affirmations")
          .select("*")
          .eq("status", "active")
          .not("id", "in", `(${ids.map((id) => `"${String(id)}"`).join(",")})`)
          .order("published_at", { ascending: false })
          .limit(Math.max(0, 3 - scheduled.length));
        if (fallbackError) throw fallbackError;

        return json(
          [...scheduled, ...(fallbackData || []).map((item) => mapAffirmation(item as Record<string, unknown>))].slice(0, 3),
          { headers: corsHeaders }
        );
      }

      const { data, error } = await supabaseAdmin
        .from("affirmations")
        .select("*")
        .eq("status", "active")
        .order("published_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return json((data || []).map((item) => mapAffirmation(item as Record<string, unknown>)), { headers: corsHeaders });
    }

    if (action === "getKeyChallenges") {
      const limit = Math.min(Math.max(Number(body?.limit || 5), 1), 20);
      const { data: latestAssessment, error: latestAssessmentError } = await supabaseAdmin
        .from("assessments")
        .select("id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestAssessmentError) throw latestAssessmentError;

      if (latestAssessment?.id) {
      const { data: latestRun, error: latestRunError } = await supabaseAdmin
        .from("ai_challenge_runs")
        .select("id, status, assessment_id")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestRunError) throw latestRunError;

      if (latestRun?.id) {
        const { data: aiData, error: aiError } = await supabaseAdmin
          .from("ai_challenges")
          .select("*")
          .eq("run_id", latestRun.id)
          .order("position", { ascending: true })
          .limit(limit);
          if (aiError) throw aiError;

          if ((aiData || []).length > 0) {
            return json((aiData || []).map((item) => mapAiChallenge(item as Record<string, unknown>)), { headers: corsHeaders });
          }
        }
      }

      return json([], { headers: corsHeaders });

      return json([], { headers: corsHeaders });
    }

    if (action === "generateKeyChallengesForLatestAssessment" || action === "askAiAboutChallenge") {
      // AI operations are handled by the dedicated app-ai Edge Function.
      return errorResponse(400, "AI operations have moved to the app-ai endpoint.", undefined, { headers: corsHeaders });
    }

    if (action === "getRecommendedContent") {
      const [{ data: profile }, { data: resources, error }] = await Promise.all([
        supabaseAdmin.from("profiles").select("stats").eq("id", user.id).maybeSingle(),
        supabaseAdmin
          .from("resources")
          .select("*")
          .eq("status", "active")
          .order("published_at", { ascending: false })
          .limit(40),
      ]);
      if (error) throw error;

      const stats = (profile?.stats && typeof profile.stats === "object") ? profile.stats as Record<string, unknown> : {};
      const themes = (stats?.themes && typeof stats.themes === "object") ? stats.themes as Record<string, unknown> : {};
      const weakThemes = Object.entries(themes)
        .filter(([, score]) => Number(score) > 0 && Number(score) <= 3)
        .sort((a, b) => Number(a[1]) - Number(b[1]))
        .map(([theme]) => String(theme || "").trim().toLowerCase());

      const mapped = (resources || []).map((item) => mapResource(item as Record<string, unknown>));
      const ranked = weakThemes.length
        ? mapped.filter((item) => {
          const tags = [...normalizeTags(item.tags), ...normalizeTags(item.themes), String(item.category || "").toLowerCase()];
          return tags.some((tag) => weakThemes.includes(String(tag || "").toLowerCase()));
        })
        : [];

      return json({ items: (ranked.length ? ranked : mapped).slice(0, 10) }, { headers: corsHeaders });
    }

    if (action === "getDashboardData") {
      const profilePromise = supabaseAdmin.from("profiles").select("stats, wellbeing_score, wellbeing_label, streak").eq("id", user.id).maybeSingle();
      const latestAssessmentPromise = supabaseAdmin.from("assessments").select("id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      const latestRunPromise = supabaseAdmin.from("ai_challenge_runs").select("id").eq("user_id", user.id).eq("status", "completed").order("created_at", { ascending: false }).limit(1).maybeSingle();
      const resourcesPromise = supabaseAdmin.from("resources").select("*").eq("status", "active").order("published_at", { ascending: false }).limit(40);

      const [
        { data: profile },
        { data: latestAssessment },
        { data: latestRun },
        { data: resources }
      ] = await Promise.all([profilePromise, latestAssessmentPromise, latestRunPromise, resourcesPromise]);

      let challenges = [];
      if (latestAssessment?.id && latestRun?.id) {
        const { data: aiData } = await supabaseAdmin.from("ai_challenges").select("*").eq("run_id", latestRun.id).order("position", { ascending: true }).limit(5);
        if ((aiData || []).length > 0) {
          challenges = (aiData || []).map((item) => mapAiChallenge(item as Record<string, unknown>));
        }
      }

      const statsObject = (profile?.stats && typeof profile.stats === "object") ? profile.stats as Record<string, unknown> : {};
      const themes = (statsObject?.themes && typeof statsObject.themes === "object") ? statsObject.themes as Record<string, unknown> : {};
      const weakThemes = Object.entries(themes)
        .filter(([, score]) => Number(score) > 0 && Number(score) <= 3)
        .sort((a, b) => Number(a[1]) - Number(b[1]))
        .map(([t]) => String(t || "").trim().toLowerCase());

      const mappedResources = (resources || []).map((item) => mapResource(item as Record<string, unknown>));
      const rankedResources = weakThemes.length
        ? mappedResources.filter((item) => {
            const tags = [...normalizeTags(item.tags), ...normalizeTags(item.themes), String(item.category || "").toLowerCase()];
            return tags.some((tag) => weakThemes.includes(String(tag || "").toLowerCase()));
          })
        : [];

      return json({
        wellbeing: {
          score: typeof profile?.wellbeing_score === "number" ? profile.wellbeing_score : null,
          label: profile?.wellbeing_label || "No data",
          streak: Number(profile?.streak || 0)
        },
        challenges: challenges,
        recommendations: (rankedResources.length ? rankedResources : mappedResources).slice(0, 10)
      }, { headers: corsHeaders });
    }

    return errorResponse(400, "Unsupported action.", undefined, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to load content.", undefined, { headers: corsHeaders });
  }
});
