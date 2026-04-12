import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createStoredNotifications, sendExpoPushNotifications } from "../_shared/push.ts";
import { errorResponse, json } from "../_shared/response.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

const parseBody = async (req: Request) => {
  try {
    return await req.json();
  } catch {
    return {};
  }
};

const truncate = (value: string, length = 120) =>
  value.length > length ? `${value.slice(0, length - 1)}…` : value;

const isAuthorized = (req: Request) => {
  const expected = Deno.env.get("INTERNAL_CRON_SECRET") || "";
  if (!expected) return false;
  return req.headers.get("x-cron-secret") === expected;
};

const reserveDispatch = async (dispatchKey: string, kind: string, metadata: Record<string, unknown> = {}) => {
  const { data, error } = await supabaseAdmin
    .from("notification_dispatches")
    .insert({
      dispatch_key: dispatchKey,
      kind,
      metadata,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if (String(error.code || "") === "23505") return false;
    throw error;
  }

  return Boolean(data?.id);
};

const dispatchDailyAffirmation = async () => {
  const today = new Date().toISOString().slice(0, 10);
  const reserved = await reserveDispatch(`daily-affirmation:${today}`, "daily_affirmation", { dayKey: today });
  if (!reserved) return { kind: "daily_affirmation", skipped: true, reason: "already-dispatched" };

  const { data: dailyRows, error: dailyError } = await supabaseAdmin
    .from("daily_affirmations")
    .select("affirmation_id")
    .eq("day_key", today)
    .limit(1);
  if (dailyError) throw dailyError;
  if (!dailyRows?.length) return { kind: "daily_affirmation", skipped: true, reason: "no-affirmation" };

  const affirmationId = String(dailyRows[0].affirmation_id || "");
  const { data: affirmation, error: affirmationError } = await supabaseAdmin
    .from("affirmations")
    .select("id, content, image, status")
    .eq("id", affirmationId)
    .eq("status", "active")
    .maybeSingle();
  if (affirmationError) throw affirmationError;
  if (!affirmation) return { kind: "daily_affirmation", skipped: true, reason: "affirmation-missing" };

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .not("expo_push_tokens", "is", null);
  if (profilesError) throw profilesError;

  const userIds = (profiles || []).map((row) => String(row.id || "")).filter(Boolean);
  if (!userIds.length) return { kind: "daily_affirmation", skipped: true, reason: "no-recipients" };

  await createStoredNotifications({
    userIds,
    type: "DAILY_AFFIRMATION",
    title: "Daily affirmation",
    body: truncate(String(affirmation.content || "Take a mindful moment today.")),
    image: String(affirmation.image || ""),
    data: {
      type: "DAILY_AFFIRMATION",
      affirmationId: affirmation.id,
    },
  });

  await sendExpoPushNotifications({
    userIds,
    type: "DAILY_AFFIRMATION",
    title: "Daily affirmation",
    body: truncate(String(affirmation.content || "Take a mindful moment today.")),
    image: String(affirmation.image || ""),
    data: {
      type: "DAILY_AFFIRMATION",
      affirmationId: affirmation.id,
    },
    channelId: "default",
  });

  return { kind: "daily_affirmation", sent: userIds.length, affirmationId: affirmation.id };
};

const dispatchScheduledHuddleReminders = async () => {
  const startWindow = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const endWindow = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const { data: events, error } = await supabaseAdmin
    .from("scheduled_huddles")
    .select("id, circle_id, chat_id, title, scheduled_at, reminder_enabled")
    .eq("reminder_enabled", true)
    .gte("scheduled_at", startWindow)
    .lte("scheduled_at", endWindow);
  if (error) throw error;

  const results = [];
  for (const event of events || []) {
    const eventId = String(event.id || "");
    const circleId = String(event.circle_id || "");
    if (!eventId || !circleId) continue;

    const reserved = await reserveDispatch(`scheduled-huddle:${eventId}`, "scheduled_huddle", {
      eventId,
      circleId,
      scheduledAt: event.scheduled_at,
    });
    if (!reserved) {
      results.push({ eventId, skipped: true, reason: "already-dispatched" });
      continue;
    }

    const { data: members, error: memberError } = await supabaseAdmin
      .from("circle_members")
      .select("user_id")
      .eq("circle_id", circleId)
      .eq("status", "active");
    if (memberError) throw memberError;

    const userIds = (members || []).map((row) => String(row.user_id || "")).filter(Boolean);
    if (!userIds.length) {
      results.push({ eventId, skipped: true, reason: "no-members" });
      continue;
    }

    const { data: circle } = await supabaseAdmin
      .from("circles")
      .select("name, image")
      .eq("id", circleId)
      .maybeSingle();

    const title = String(event.title || circle?.name || "Scheduled huddle");
    const body = `Starting around now in ${circle?.name || "your circle"}`;

    await createStoredNotifications({
      userIds,
      type: "SCHEDULED_HUDDLE_REMINDER",
      title,
      body,
      avatar: String(circle?.image || ""),
      data: {
        type: "SCHEDULED_HUDDLE_REMINDER",
        eventId,
        circleId,
        chatId: event.chat_id || null,
        scheduledAt: event.scheduled_at,
      },
    });

    await sendExpoPushNotifications({
      userIds,
      type: "SCHEDULED_HUDDLE_REMINDER",
      title,
      body,
      avatar: String(circle?.image || ""),
      data: {
        type: "SCHEDULED_HUDDLE_REMINDER",
        eventId,
        circleId,
        chatId: event.chat_id || null,
        scheduledAt: event.scheduled_at,
      },
      channelId: "default",
    });

    results.push({ eventId, sent: userIds.length });
  }

  return results;
};

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  if (req.method !== "POST") return errorResponse(405, "Method not allowed.", undefined, { headers: corsHeaders });
  if (!isAuthorized(req)) return errorResponse(401, "Unauthorized.", undefined, { headers: corsHeaders });

  try {
    const body = await parseBody(req);
    const mode = String(body?.mode || "all");

    const results: Record<string, unknown> = {};
    if (mode === "all" || mode === "daily_affirmation") {
      results.dailyAffirmation = await dispatchDailyAffirmation();
    }
    if (mode === "all" || mode === "scheduled_huddle") {
      results.scheduledHuddles = await dispatchScheduledHuddleReminders();
    }

    return json({ success: true, ...results }, { headers: corsHeaders });
  } catch (error) {
    return errorResponse(500, error instanceof Error ? error.message : "Unable to dispatch notifications.", undefined, { headers: corsHeaders });
  }
});
