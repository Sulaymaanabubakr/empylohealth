import { supabaseAdmin } from "./supabase.ts";

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

type PushData = Record<string, unknown>;

type NotifyUsersInput = {
  userIds: string[];
  type: string;
  title: string;
  body: string;
  subtitle?: string;
  avatar?: string;
  image?: string;
  color?: string;
  data?: PushData;
  categoryId?: string;
  channelId?: string;
  sound?: "default" | null;
};

type ProfileRow = {
  id: string;
  name: string | null;
  photo_url: string | null;
  expo_push_tokens: string[] | null;
};

const isExpoPushToken = (token: string) =>
  /^ExponentPushToken\[[^\]]+\]$/.test(token) || /^ExpoPushToken\[[^\]]+\]$/.test(token);

const toStringArray = (value: unknown) =>
  Array.isArray(value) ? value.map((item) => String(item || "").trim()).filter(Boolean) : [];

export const loadProfilesForUsers = async (userIds: string[]) => {
  if (!userIds.length) return [] as ProfileRow[];

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, name, photo_url, expo_push_tokens")
    .in("id", userIds);

  if (error) throw error;
  return (data || []) as ProfileRow[];
};

export const createStoredNotifications = async ({
  userIds,
  type,
  title,
  body,
  subtitle = "",
  avatar = "",
  image = "",
  color = "",
  data = {},
}: NotifyUsersInput) => {
  if (!userIds.length) return;

  const rows = userIds.map((userId) => ({
    user_id: userId,
    type,
    title,
    subtitle,
    body,
    avatar,
    image,
    color,
    data: { type, ...data },
  }));

  const { error } = await supabaseAdmin.from("notifications").insert(rows);
  if (error) throw error;
};

export const sendExpoPushNotifications = async ({
  userIds,
  type,
  title,
  body,
  subtitle = "",
  avatar = "",
  image = "",
  color = "",
  data = {},
  categoryId,
  channelId,
  sound = "default",
}: NotifyUsersInput) => {
  if (!userIds.length) return { requestedUsers: 0, pushedTokens: 0 };

  const profiles = await loadProfilesForUsers(userIds);
  const messages = profiles.flatMap((profile) => {
    const tokens = toStringArray(profile.expo_push_tokens).filter(isExpoPushToken);
    return tokens.map((token) => ({
      to: token,
      title,
      subtitle,
      body,
      sound,
      data: { type, ...data },
      categoryId,
      channelId,
      priority: "high",
    }));
  });

  if (!messages.length) {
    return { requestedUsers: userIds.length, pushedTokens: 0 };
  }

  const response = await fetch(EXPO_PUSH_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Expo push send failed (${response.status}): ${text || "Unknown error"}`);
  }

  return {
    requestedUsers: userIds.length,
    pushedTokens: messages.length,
  };
};
