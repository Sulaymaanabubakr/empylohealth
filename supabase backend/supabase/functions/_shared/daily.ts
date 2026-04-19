import { errorResponse } from "./response.ts";

const dailyApiKey = Deno.env.get("DAILY_API_KEY") || "";

const ensureDailyApiKey = () => {
  if (!dailyApiKey) {
    throw errorResponse(500, "Missing Daily API key.");
  }
};

export const createDailyRoom = async (chatId: string) => {
  ensureDailyApiKey();

  const roomName = `chat-${chatId}-${crypto.randomUUID().slice(0, 8)}`;
  const response = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${dailyApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: roomName,
      properties: {
        enable_chat: true,
        start_video_off: false,
        start_audio_off: false,
        eject_at_room_exp: true,
        exp: Math.floor(Date.now() / 1000) + (60 * 60),
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.url) {
    throw errorResponse(500, "Unable to create Daily room.");
  }

  return {
    roomName,
    roomUrl: String(payload.url),
  };
};

export const createDailyMeetingToken = async ({
  roomName,
  userId,
  userName,
  isOwner = false,
}: {
  roomName: string;
  userId: string;
  userName?: string | null;
  isOwner?: boolean;
}) => {
  ensureDailyApiKey();

  const response = await fetch("https://api.daily.co/v1/meeting-tokens", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${dailyApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        is_owner: isOwner,
        user_id: userId,
        user_name: userName || undefined,
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.token) {
    throw errorResponse(500, "Unable to create Daily meeting token.");
  }

  return String(payload.token);
};

export const getDailyRoom = async (roomName: string) => {
  ensureDailyApiKey();

  const response = await fetch(`https://api.daily.co/v1/rooms/${encodeURIComponent(roomName)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${dailyApiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 404) return null;

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw errorResponse(500, "Unable to verify Daily room.");
  }

  return payload;
};
