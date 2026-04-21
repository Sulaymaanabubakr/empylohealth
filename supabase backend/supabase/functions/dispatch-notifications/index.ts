import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createStoredNotifications, loadProfilesForUsers, sendExpoPushNotifications } from "../_shared/push.ts";
import { resolveHuddleAfterRecipientHandled } from "../_shared/huddles.ts";
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

const resolveSlotKey = (rawSlot?: unknown) => {
  const normalized = String(rawSlot || "").trim().toLowerCase();
  if (normalized === "morning" || normalized === "afternoon" || normalized === "evening") {
    return normalized;
  }

  const now = new Date();
  const lagosHour = Number(new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    hour12: false,
    timeZone: Deno.env.get("AFFIRMATION_TIMEZONE") || "Africa/Lagos",
  }).format(now));

  if (lagosHour < 12) return "morning";
  if (lagosHour < 17) return "afternoon";
  return "evening";
};

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

const dispatchDailyAffirmation = async (slotKeyInput?: unknown) => {
  const lagosNow = new Intl.DateTimeFormat("en-CA", {
    timeZone: Deno.env.get("AFFIRMATION_TIMEZONE") || "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()).replaceAll("/", "-");
  const slotKey = resolveSlotKey(slotKeyInput);
  const reserved = await reserveDispatch(`daily-affirmation:${lagosNow}:${slotKey}`, "daily_affirmation", {
    dayKey: lagosNow,
    slotKey,
  });
  if (!reserved) return { kind: "daily_affirmation", skipped: true, reason: "already-dispatched" };

  const { data: dailyRows, error: dailyError } = await supabaseAdmin
    .from("daily_affirmations")
    .select("affirmation_id, slot_key")
    .eq("day_key", lagosNow)
    .eq("slot_key", slotKey)
    .limit(1);
  if (dailyError) throw dailyError;
  if (!dailyRows?.length) return { kind: "daily_affirmation", skipped: true, reason: "no-affirmation", slotKey };

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
    .select("id, expo_push_tokens");
  if (profilesError) throw profilesError;

  const userIds = (profiles || [])
    .filter((row) => Array.isArray(row.expo_push_tokens) && row.expo_push_tokens.some((token) => String(token || "").trim()))
    .map((row) => String(row.id || ""))
    .filter(Boolean);
  if (!userIds.length) return { kind: "daily_affirmation", skipped: true, reason: "no-recipients", slotKey };

  const title = slotKey === "afternoon"
    ? "Afternoon affirmation"
    : slotKey === "evening"
      ? "Evening affirmation"
      : "Morning affirmation";

  await createStoredNotifications({
    userIds,
    type: "DAILY_AFFIRMATION",
    title,
    body: truncate(String(affirmation.content || "Take a mindful moment today.")),
    image: String(affirmation.image || ""),
    data: {
      type: "DAILY_AFFIRMATION",
      affirmationId: affirmation.id,
      slotKey,
    },
  });

  await sendExpoPushNotifications({
    userIds,
    type: "DAILY_AFFIRMATION",
    title,
    body: truncate(String(affirmation.content || "Take a mindful moment today.")),
    image: String(affirmation.image || ""),
    data: {
      type: "DAILY_AFFIRMATION",
      affirmationId: affirmation.id,
      slotKey,
    },
    channelId: "default",
  });

  return { kind: "daily_affirmation", sent: userIds.length, affirmationId: affirmation.id, slotKey };
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

const dispatchMissedHuddles = async () => {
  const threshold = new Date(Date.now() - 60 * 1000).toISOString();
  const { data: rows, error } = await supabaseAdmin
    .from("missed_huddles")
    .select("id, huddle_id, chat_id, caller_id, receiver_id, status, created_at")
    .eq("status", "pending")
    .lte("created_at", threshold)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw error;

  const pendingRows = rows || [];
  if (!pendingRows.length) return [];

  const huddleIds = Array.from(new Set(pendingRows.map((row) => String(row.huddle_id || "")).filter(Boolean)));
  const callerIds = Array.from(new Set(pendingRows.map((row) => String(row.caller_id || "")).filter(Boolean)));
  const chatIds = Array.from(new Set(pendingRows.map((row) => String(row.chat_id || "")).filter(Boolean)));

  const [{ data: huddles }, callerProfiles, { data: chats }] = await Promise.all([
    supabaseAdmin
      .from("huddles")
      .select("id, chat_id, started_by, type, status, is_active, invited_user_ids, accepted_user_ids, declined_user_ids")
      .in("id", huddleIds),
    loadProfilesForUsers(callerIds),
    supabaseAdmin
      .from("chats")
      .select("id, name, avatar")
      .in("id", chatIds),
  ]);

  const huddleById = new Map((huddles || []).map((row) => [String(row.id), row]));
  const callerById = new Map(callerProfiles.map((row) => [String(row.id), row]));
  const chatById = new Map((chats || []).map((row) => [String(row.id), row]));

  const results = [];
  for (const row of pendingRows) {
    const huddleId = String(row.huddle_id || "");
    const receiverId = String(row.receiver_id || "");
    if (!huddleId || !receiverId) continue;

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("missed_huddles")
      .update({
        status: "missed",
        handled_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .eq("status", "pending")
      .select("*")
      .maybeSingle();
    if (updateError) throw updateError;
    if (!updated) continue;

    const huddle = huddleById.get(huddleId);
    if (huddle) {
      await resolveHuddleAfterRecipientHandled({
        huddle,
        receiverId,
        reason: "missed",
      });
    }

    const caller = callerById.get(String(row.caller_id || ""));
    const chat = chatById.get(String(row.chat_id || ""));
    const title = caller?.name ? `You missed a huddle from ${caller.name}` : "You missed a huddle";
    const body = chat?.name ? `Open ${chat.name} to check if it is still live.` : "Open the app to see whether it is still active.";

    await createStoredNotifications({
      userIds: [receiverId],
      type: "MISSED_HUDDLE",
      title,
      body,
      avatar: caller?.photo_url || chat?.avatar || "",
      data: {
        type: "MISSED_HUDDLE",
        huddleId,
        chatId: String(row.chat_id || ""),
        callerId: String(row.caller_id || ""),
        callerName: caller?.name || "",
        chatName: chat?.name || "Huddle",
      },
    });

    await sendExpoPushNotifications({
      userIds: [receiverId],
      type: "MISSED_HUDDLE",
      title,
      body,
      avatar: caller?.photo_url || chat?.avatar || "",
      data: {
        type: "MISSED_HUDDLE",
        huddleId,
        chatId: String(row.chat_id || ""),
        callerId: String(row.caller_id || ""),
        callerName: caller?.name || "",
        chatName: chat?.name || "Huddle",
      },
      channelId: "default",
    }).catch(() => {});

    results.push({ huddleId, receiverId, status: "missed" });
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
    const slotKey = body?.slotKey;

    const results: Record<string, unknown> = {};
    if (mode === "all" || mode === "daily_affirmation") {
      results.dailyAffirmation = await dispatchDailyAffirmation(slotKey);
    }
    if (mode === "all" || mode === "scheduled_huddle") {
      results.scheduledHuddles = await dispatchScheduledHuddleReminders();
    }
    if (mode === "all" || mode === "missed_huddles") {
      results.missedHuddles = await dispatchMissedHuddles();
    }

    return json({ success: true, ...results }, { headers: corsHeaders });
  } catch (error) {
    return errorResponse(500, error instanceof Error ? error.message : "Unable to dispatch notifications.", undefined, { headers: corsHeaders });
  }
});
