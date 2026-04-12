import { requireUser } from "../_shared/auth.ts";
import { writeAuditLog } from "../_shared/audit.ts";
import { writeAnalyticsEvent } from "../_shared/analytics.ts";
import { generateStructuredText } from "../_shared/ai.ts";
import {
  claimIdempotency,
  completeIdempotency,
  failIdempotency,
  finalizeAiCredits,
  releaseAiCredits,
  reserveAiCredits,
  resolveSubscriptionStatus,
} from "../_shared/billing.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { writeObservabilityEvent } from "../_shared/observability.ts";
import { getIpAddress, getUserAgent } from "../_shared/request.ts";
import { errorResponse, json } from "../_shared/response.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

const parseBody = async (req: Request) => {
  try {
    return await req.json();
  } catch {
    return {};
  }
};

const hashRequest = async (payload: unknown) => {
  const data = new TextEncoder().encode(JSON.stringify(payload || {}));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const extractSuggestions = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(/\n|•|-/).map((item) => item.trim()).filter(Boolean).slice(0, 5);
  }
  return [];
};

const parseChallengeResponse = (text: string) => {
  try {
    const parsed = JSON.parse(text);
    const items = Array.isArray(parsed?.challenges) ? parsed.challenges : Array.isArray(parsed) ? parsed : [];
    return items.map((item: Record<string, unknown>, index: number) => ({
      title: String(item?.title || `Key challenge ${index + 1}`),
      level: String(item?.level || "medium").toLowerCase(),
      explanation: String(item?.explanation || item?.description || ""),
      suggestions: extractSuggestions(item?.suggestions),
      details: item,
      position: index,
    }));
  } catch {
    return [];
  }
};

const normalizeConversationMessages = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      role: String((item as Record<string, unknown>)?.role || "").toLowerCase(),
      content: String((item as Record<string, unknown>)?.content || "").trim(),
    }))
    .filter((item) => (item.role === "user" || item.role === "assistant") && item.content)
    .slice(-12) as { role: "user" | "assistant"; content: string }[];
};

const formatSignalLabel = (key: string) =>
  String(key || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());

const describeScaleValue = (key: string, value: number) => {
  const normalized = String(key || "").toLowerCase();
  const label = formatSignalLabel(key);
  if (!Number.isFinite(value)) {
    return null;
  }

  if (normalized.includes("focus")) {
    if (value >= 8) return `${label} is ${value}/10, which suggests you're able to maintain a high level of focus.`;
    if (value >= 5) return `${label} is ${value}/10, which suggests your focus is fairly steady but may dip at times.`;
    return `${label} is ${value}/10, which suggests it may feel hard to stay focused consistently.`;
  }

  if (normalized.includes("motivation")) {
    if (value >= 8) return `${label} is ${value}/10, which suggests you're feeling ready to start and follow through on tasks.`;
    if (value >= 5) return `${label} is ${value}/10, which suggests motivation is present but may need a little support.`;
    return `${label} is ${value}/10, which suggests it may feel hard to start or finish tasks right now.`;
  }

  if (normalized.includes("energy")) {
    if (value >= 8) return `${label} is ${value}/10, which suggests your energy feels strong today.`;
    if (value >= 5) return `${label} is ${value}/10, which suggests your energy is moderate and may need pacing.`;
    return `${label} is ${value}/10, which suggests your energy may feel low right now.`;
  }

  if (normalized.includes("stress")) {
    if (value >= 8) return `${label} is ${value}/10, which suggests stress may be feeling very high right now.`;
    if (value >= 5) return `${label} is ${value}/10, which suggests some stress is present.`;
    return `${label} is ${value}/10, which suggests stress looks relatively low at the moment.`;
  }

  if (normalized.includes("sleep")) {
    if (value >= 8) return `${label} is ${value}/10, which suggests sleep is feeling strong and restorative.`;
    if (value >= 5) return `${label} is ${value}/10, which suggests sleep is okay but not fully settled.`;
    return `${label} is ${value}/10, which suggests sleep may need more support.`;
  }

  if (normalized.includes("connection") || normalized.includes("social")) {
    if (value >= 8) return `${label} is ${value}/10, which suggests you feel well connected to others.`;
    if (value >= 5) return `${label} is ${value}/10, which suggests connection is present but could be stronger.`;
    return `${label} is ${value}/10, which suggests you may be feeling disconnected or isolated.`;
  }

  return `${label} is ${value}/10.`;
};

const extractAssessmentSignals = (answers: unknown) => {
  if (!answers || typeof answers !== "object") return [];
  return Object.entries(answers as Record<string, unknown>)
    .map(([key, rawValue]) => {
      const numeric = typeof rawValue === "number" ? rawValue : Number(rawValue);
      if (!Number.isFinite(numeric)) return null;
      return {
        key,
        label: formatSignalLabel(key),
        value: numeric,
        explanation: describeScaleValue(key, numeric),
      };
    })
    .filter(Boolean) as { key: string; label: string; value: number; explanation: string | null }[];
};

const extractThemeScores = (stats: unknown) => {
  const themes = (stats && typeof stats === "object" && typeof (stats as Record<string, unknown>).themes === "object")
    ? (stats as Record<string, unknown>).themes as Record<string, unknown>
    : {};

  return Object.entries(themes)
    .map(([key, rawValue]) => {
      const numeric = typeof rawValue === "number" ? rawValue : Number(rawValue);
      if (!Number.isFinite(numeric)) return null;
      return {
        key,
        label: formatSignalLabel(key),
        value: numeric,
      };
    })
    .filter(Boolean)
    .sort((a, b) => Number(b?.value || 0) - Number(a?.value || 0)) as { key: string; label: string; value: number }[];
};

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  if (req.method !== "POST") return errorResponse(405, "Method not allowed.", undefined, { headers: corsHeaders });

  try {
    const body = await parseBody(req);
    const action = String(body?.action || "");
    const { user } = await requireUser(req);

    if (!["generateKeyChallengesForLatestAssessment", "askAiAboutChallenge"].includes(action)) {
      return errorResponse(400, "Unsupported action.", undefined, { headers: corsHeaders });
    }

    if (action === "askAiAboutChallenge") {
      const challenge = (body?.challenge && typeof body.challenge === "object") ? body.challenge as Record<string, unknown> : {};
      const messages = normalizeConversationMessages(body?.messages);
      const latestUserMessage = [...messages].reverse().find((item) => item.role === "user")?.content || "";
      if (!latestUserMessage.trim()) {
        return errorResponse(400, "A message is required to continue with AI.", undefined, { headers: corsHeaders });
      }

      const idempotencyKey = String(body?.idempotencyKey || `challenge:${String(challenge?.id || challenge?.title || "chat")}:${latestUserMessage}`).trim();
      const requestHash = await hashRequest({
        action,
        challenge,
        messages,
      });
      const idempotent = await claimIdempotency({
        scope: "assistant_message",
        userId: user.id,
        key: idempotencyKey,
        requestHash,
      });

      if (String(idempotent?.status || "") === "completed" && idempotent?.response) {
        return json({ ...(idempotent.response as Record<string, unknown>), idempotentReplay: true }, { headers: corsHeaders });
      }

      const status = await resolveSubscriptionStatus(user.id) as Record<string, unknown>;
      const canUseAiAssistant = Boolean((status?.capabilities as Record<string, unknown>)?.canUseAiAssistant);
      if (!canUseAiAssistant) {
        const response = { success: false, message: "AI follow-up is available on paid plans." };
        await failIdempotency({
          scope: "assistant_message",
          key: idempotencyKey,
          response,
        });
        return errorResponse(403, "AI follow-up is available on paid plans.", undefined, { headers: corsHeaders });
      }

      const reserve = await reserveAiCredits({
        userId: user.id,
        operationType: "assistant_message",
        idempotencyKey,
        credits: 10,
        requestPayload: {
          challengeId: String(challenge?.id || ""),
          challengeTitle: String(challenge?.title || ""),
          messageCount: messages.length,
        },
      });

      if (!reserve?.success) {
        await failIdempotency({
          scope: "assistant_message",
          key: idempotencyKey,
          response: reserve as Record<string, unknown>,
        });
        return errorResponse(402, "You do not have enough AI credits.", { reasonCode: reserve?.reasonCode }, { headers: corsHeaders });
      }

      try {
        const [
          { data: profile },
          { data: assessments },
          { data: circleMembers },
          { data: aiChallenges }
        ] = await Promise.all([
          supabaseAdmin.from('profiles').select('wellbeing_score, wellbeing_label, streak, stats').eq('id', user.id).limit(1),
          supabaseAdmin.from('assessments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
          supabaseAdmin.from('circle_members').select('circle_id, role, status').eq('user_id', user.id).eq('status', 'active'),
          supabaseAdmin.from('ai_challenges').select('title, level, explanation').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
        ]);

        const userProfile = profile?.[0] || {};
        const latestAssessment = assessments?.[0] || null;
        const joinedCircles = circleMembers || [];
        const activeChallenges = aiChallenges || [];
        const assessmentSignals = extractAssessmentSignals(latestAssessment?.answers || {});
        const themeScores = extractThemeScores(userProfile.stats);
        const strongestTheme = themeScores[0] || null;
        const weakestTheme = themeScores.length ? themeScores[themeScores.length - 1] : null;

        const stats = (typeof userProfile.stats === 'object' && userProfile.stats) ? userProfile.stats : {};
        const activitiesCompleted = Number((stats as Record<string, unknown>)?.activitiesCompleted || 0);
        const huddleParticipation = Number((stats as Record<string, unknown>)?.huddleParticipation || 0);
        const recommendedActivities = Array.isArray((stats as Record<string, unknown>)?.recommendedActivities) ? (stats as Record<string, unknown>).recommendedActivities : [];

        const engagementScore = joinedCircles.length + (huddleParticipation * 2);
        const circleEngagement = engagementScore > 5 ? "high" : engagementScore > 0 ? "medium" : "low";

        const userContextJson = JSON.stringify({
          wellbeingScore: userProfile.wellbeing_score ?? 0,
          ringStatus: userProfile.wellbeing_label ?? "none",
          moodTrend: latestAssessment?.mood ?? "unknown",
          activitiesCompleted,
          streak: userProfile.streak ?? 0,
          recommendedActivities,
          circles: joinedCircles.map(c => (c as Record<string, unknown>).circle_id),
          circleEngagement,
          huddleParticipation,
          latestAssessment,
          keyChallenges: activeChallenges,
          assessmentSignals,
          themeScores,
          strongestTheme,
          weakestTheme,
        }, null, 2);

        const generated = await generateStructuredText({
          system: [
            "You are a warm, highly empathetic mental wellbeing coach inside the Circles Health App.",
            "You speak naturally, conversationally, and kindly to the user above all else.",
            "",
            "Your role is to understand the user using BOTH:",
            "1. What they say in chat",
            "2. Their real app data (provided in context)",
            "",
            "You must ALWAYS prioritise real user data, but weave it in naturally.",
            "Do not sound like a database export, debug log, or generic report.",
            "Avoid headings like 'Data Signals' or 'Next Step' unless the user explicitly asks for a report format.",
            "If a number helps understanding, you MAY use it naturally, for example: 'Your focus level is 10/10, which usually means you're able to hold a high level of focus.'",
            "",
            "You operate in two modes depending on what the user asks:",
            "1. Quick Support Mode -> short warm response, one clear next step, at most one gentle follow-up question.",
            "2. Insight Mode -> still conversational, but a little more detailed and structured in short paragraphs or short bullets.",
            "",
            "When the user asks for their key insights, key challenges, or how they are doing:",
            "- Start with a natural transition like 'Sure, let me pull up your key insights for today.'",
            "- Then explain what their latest strongest signal means in plain English.",
            "- Compare it against their weaker signals or themes where relevant.",
            "- Example style: 'Your focus level is 10/10, which suggests you're able to maintain a high level of focus. Your motivation is 3/10, which suggests it may feel harder to start and finish tasks right now.'",
            "- Mention the strongest theme and weakest theme if they are available.",
            "- Never say 'what the app thinks would help most' or similar phrasing.",
            "- Do not make the insight sound like a machine verdict or system label.",
            "- Frame it more naturally as 'what stands out today', 'what may need a bit more support', or 'a few areas worth looking after today'.",
            "- Treat challenges as supportive focus areas for today, not as fixed problems or app-generated labels.",
            "- End with one grounded takeaway or next step.",
            "",
            "FORMATTING STYLE:",
            "- Use light markdown formatting so the chat is easier to scan.",
            "- Prefer short bold section labels on their own line, such as '**How you're doing**' or '**What stands out today**'.",
            "- For bullets, use bold lead-ins when helpful, such as '- **Overall wellbeing:** ...' or '- **Focus:** ...'.",
            "- Keep the structure friendly and calm, not corporate or report-like.",
            "",
            "Always align your structural themes to: Focus Area, Connection, Growth, Daily Win.",
            "",
            "CORE INSTRUCTIONS:",
            "1. Explain Wellbeing: Use their score, ring status, assessment signals, theme scores, and challenges intuitively but keep the explanation simple and human.",
            "2. Recommend Activities: Suggest self-development/group activities tailored toward their weakest reported areas or inactivity.",
            "3. Recommend Circles: ",
            "   - If they are struggling, encourage them to engage with their Existing Circles.",
            "   - If they are thriving, suggest they support others in their Existing Circles.",
            "   - If suggesting Public Circles, limit to 1-2 recommendations mapped strictly against their wellbeing score and key challenges.",
            "4. Key Challenges: Focus only on their stored challenges, extending/explaining them rather than randomly generating completely new ones.",
            "5. If the user asks 'what does X mean?', explain the exact signal plainly first, then relate it to the rest of their profile.",
            "",
            "CRISIS & LOW MOOD PROTOCOL:",
            "If the user expresses anxiety, low mood, or emotional distress you MUST:",
            "1. Acknowledge them simply, calmly, and validatingly.",
            "2. Offer a very small, practical grounding or reflective suggestion.",
            "3. Suggest reaching out to someone they trust.",
            "4. Provide NO MORE THAN ONE support resource if absolutely necessary.",
            "NEVER overload them with statistics, multiple services, or intense medical questions.",
            "",
            "SAFETY RULES:",
            "- NEVER present yourself as a professional or act like a therapist.",
            "- NEVER give medical or clinical advice or attempt a diagnosis.",
            "- NEVER ignore user emotional signals.",
            "- NEVER write long dense paragraphs. Keep sentences brief. One question maximum.",
            "- NEVER invent data. Use existing data, otherwise fall back to user message.",
            "- Be clear, structured, and highly practical, acting as a smart, safe, calming companion.",
            "",
            "USER CONTEXT DATA:",
            userContextJson,
            "",
            "CURRENT CHAT SESSION FOCUS:",
            `Challenge title: ${String(challenge?.title || "General check-in")}`,
            `Challenge explanation: ${String(challenge?.explanation || challenge?.description || "")}`
          ].join("\n"),
          messages,
          maxContextTokens: Number((status?.limits as Record<string, unknown>)?.maxAiContextTokens || 4000),
          maxResponseTokens: Number((status?.limits as Record<string, unknown>)?.maxAiResponseTokens || 500),
          temperature: 0.45,
        });

        await finalizeAiCredits({
          attemptId: String(reserve.attemptId),
          sourceId: String(challenge?.id || challenge?.title || "challenge_ai_chat"),
          resultPayload: {
            challengeId: String(challenge?.id || ""),
            challengeTitle: String(challenge?.title || ""),
          },
        });

        const response = {
          success: true,
          reply: generated.text,
          creditsCharged: 10,
          remaining: (await resolveSubscriptionStatus(user.id))?.remaining || null,
        };

        await writeAnalyticsEvent({
          userId: user.id,
          eventType: "ai.assistant_message",
          planId: String((status?.entitlement as Record<string, unknown>)?.plan || ""),
          amount: 10,
          metadata: {
            challengeId: String(challenge?.id || ""),
            challengeTitle: String(challenge?.title || ""),
          },
        });
        await writeObservabilityEvent({
          source: "app-ai",
          eventType: "assistant_message.completed",
          metadata: {
            userId: user.id,
            challengeId: String(challenge?.id || ""),
          },
        });
        await completeIdempotency({
          scope: "assistant_message",
          key: idempotencyKey,
          response,
          resourceType: "usage_attempt",
          resourceId: String(reserve.attemptId),
        });
        return json(response, { headers: corsHeaders });
      } catch (error) {
        await releaseAiCredits({
          attemptId: String(reserve.attemptId),
          errorMessage: error instanceof Error ? error.message : "Assistant request failed.",
          resultPayload: {
            challengeId: String(challenge?.id || ""),
          },
        });
        await failIdempotency({
          scope: "assistant_message",
          key: idempotencyKey,
          response: {
            success: false,
            message: error instanceof Error ? error.message : "Assistant request failed.",
          },
        });
        await writeObservabilityEvent({
          source: "app-ai",
          eventType: "assistant_message.failed",
          metadata: {
            userId: user.id,
            error: error instanceof Error ? error.message : "unknown",
          },
        });
        return errorResponse(500, error instanceof Error ? error.message : "Assistant request failed.", undefined, { headers: corsHeaders });
      }
    }

    const idempotencyKey = String(body?.idempotencyKey || `assessment:${body?.assessmentId || "latest"}`).trim();
    const requestHash = await hashRequest(body);
    const idempotent = await claimIdempotency({
      scope: "key_challenge_generation",
      userId: user.id,
      key: idempotencyKey,
      requestHash,
    });
    if (String(idempotent?.status || "") === "completed" && idempotent?.response) {
      return json({ ...(idempotent.response as Record<string, unknown>), idempotentReplay: true }, { headers: corsHeaders });
    }

    const status = await resolveSubscriptionStatus(user.id) as Record<string, unknown>;
    const canUseAi = Boolean((status?.capabilities as Record<string, unknown>)?.canUseAiAssistant)
      || Boolean((status?.capabilities as Record<string, unknown>)?.hasFullKeyChallenges)
      || String(((status?.entitlement as Record<string, unknown>)?.plan || "free")) === "free";

    if (!canUseAi) {
      await failIdempotency({
        scope: "key_challenge_generation",
        key: idempotencyKey,
        response: { success: false, message: "Your plan cannot generate key challenges right now." },
      });
      return errorResponse(403, "Your plan cannot generate key challenges right now.", undefined, { headers: corsHeaders });
    }

    const assessmentId = String(body?.assessmentId || "").trim();
    const assessmentQuery = supabaseAdmin
      .from("assessments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const { data: assessmentRow, error: assessmentError } = assessmentId
      ? await supabaseAdmin.from("assessments").select("*").eq("id", assessmentId).eq("user_id", user.id).maybeSingle()
      : await assessmentQuery.maybeSingle();

    if (assessmentError) throw assessmentError;
    if (!assessmentRow) {
      return errorResponse(404, "No assessment found to generate insights from.", undefined, { headers: corsHeaders });
    }

    const { data: existingRun } = await supabaseAdmin
      .from("ai_challenge_runs")
      .select("id, status, result")
      .eq("assessment_id", assessmentRow.id)
      .maybeSingle();

    if (existingRun?.id && existingRun.status === "completed") {
      const { data: existingChallenges } = await supabaseAdmin
        .from("ai_challenges")
        .select("*")
        .eq("run_id", existingRun.id)
        .order("position", { ascending: true });

      const response = {
        success: true,
        assessmentId: assessmentRow.id,
        challenges: (existingChallenges || []).map((item) => ({
          id: item.id,
          title: item.title,
          level: item.level,
          explanation: item.explanation,
          suggestions: item.suggestions || [],
          generatedAt: item.created_at,
        })),
      };
      await completeIdempotency({
        scope: "key_challenge_generation",
        key: idempotencyKey,
        response,
        resourceType: "ai_challenge_run",
        resourceId: existingRun.id,
      });
      return json(response, { headers: corsHeaders });
    }

    const reserve = await reserveAiCredits({
      userId: user.id,
      operationType: "key_challenge_generation",
      idempotencyKey,
      credits: 2,
      requestPayload: { assessmentId: assessmentRow.id },
    });

    if (!reserve?.success) {
      await failIdempotency({
        scope: "key_challenge_generation",
        key: idempotencyKey,
        response: reserve as Record<string, unknown>,
      });
      return errorResponse(402, "You do not have enough AI credits.", { reasonCode: reserve?.reasonCode }, { headers: corsHeaders });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("wellbeing_score, wellbeing_label, stats")
      .eq("id", user.id)
      .maybeSingle();

    const sourceSummary = {
      type: assessmentRow.type,
      score: assessmentRow.score,
      mood: assessmentRow.mood || "",
      answers: assessmentRow.answers || {},
      wellbeingScore: profile?.wellbeing_score ?? null,
      wellbeingLabel: profile?.wellbeing_label ?? "",
      themes: profile?.stats?.themes || {},
    };

    const { data: runRow, error: runError } = await supabaseAdmin
      .from("ai_challenge_runs")
      .upsert({
        user_id: user.id,
        assessment_id: assessmentRow.id,
        usage_attempt_id: reserve.attemptId,
        provider: "openai",
        model: Deno.env.get("OPENAI_MODEL") || "gpt-5.4-nano",
        status: "pending",
        source_summary: sourceSummary,
      }, { onConflict: "assessment_id" })
      .select("*")
      .single();
    if (runError) throw runError;

    try {
      const generated = await generateStructuredText({
        system: [
          "You are a mental wellbeing coach.",
          "Return strict JSON with a top-level 'challenges' array containing exactly 4 items.",
          "Each challenge MUST belong to a specific theme. The 4 themes are: 'Focus Area', 'Connection', 'Growth', 'Daily Win'.",
          "Rules for each theme:",
          " - Focus Area: Addresses the weakest or most needed area from the assessment.",
          " - Connection: Social and relationship-based challenge.",
          " - Growth: Personal development, consistency, mindset.",
          " - Daily Win: Small, simple, achievable actions.",
          "Each challenge MUST include:",
          " - 'theme' (string: strictly one of the 4 themes)",
          " - 'title' (string: clear and engaging)",
          " - 'explanation' (string: short description of what to do)",
          " - 'suggestions' (array of strings: actionable steps to take)",
          " - 'reason' (string: short, simple, human-readable reason why this is recommended based on the user's data. e.g. 'Based on your recent mood' or 'Because your social activity has been low').",
          "Do not mix themes. Keep the challenge clear, short, and actionable.",
          "Return exactly 4 items, one for each theme."
        ].join(" "),
        messages: [
          {
            role: "user",
            content: `Generate exactly 4 key challenges from this assessment summary: ${JSON.stringify(sourceSummary)}`,
          },
        ],
        maxContextTokens: Number((status?.limits as Record<string, unknown>)?.maxAiContextTokens || 4000),
        maxResponseTokens: Number((status?.limits as Record<string, unknown>)?.maxAiResponseTokens || 1000),
      });

      const parsed = parseChallengeResponse(generated.text);
      const normalized = (parsed.length === 4) ? parsed : [
        {
          title: "Take a deep breath",
          theme: "Focus Area",
          reason: "Because taking a moment to recenter is always beneficial.",
          level: "medium",
          explanation: "Take a moment to recenter yourself and clear your mind.",
          suggestions: ["Practice deep breathing for 2 minutes"],
          details: { theme: "Focus Area", reason: "Because taking a moment to recenter is always beneficial." },
          position: 0,
        },
        {
          title: "Reach out to someone",
          theme: "Connection",
          reason: "Because maintaining social ties improves overall wellbeing.",
          level: "medium",
          explanation: "Send a quick message or call a friend you haven't spoken to recently.",
          suggestions: ["Send a text to check in"],
          details: { theme: "Connection", reason: "Because maintaining social ties improves overall wellbeing." },
          position: 1,
        },
        {
          title: "Reflect on a recent win",
          theme: "Growth",
          reason: "Because reviewing progress helps build confidence.",
          level: "low",
          explanation: "Think about something you achieved recently and appreciate the effort it took.",
          suggestions: ["Write down one recent accomplishment"],
          details: { theme: "Growth", reason: "Because reviewing progress helps build confidence." },
          position: 2,
        },
        {
          title: "Drink a glass of water",
          theme: "Daily Win",
          reason: "Because staying hydrated is an easy daily goal.",
          level: "low",
          explanation: "Hydration is key. Drink a glass of water right now.",
          suggestions: ["Drink water"],
          details: { theme: "Daily Win", reason: "Because staying hydrated is an easy daily goal." },
          position: 3,
        }
      ];

      await supabaseAdmin.from("ai_challenges").delete().eq("run_id", runRow.id);
      await supabaseAdmin.from("ai_challenges").insert(
        normalized.map((item, index) => ({
          run_id: runRow.id,
          user_id: user.id,
          assessment_id: assessmentRow.id,
          title: item.title,
          level: item.level,
          explanation: item.explanation,
          suggestions: item.suggestions,
          details: item.details,
          position: index,
        })),
      );

      await supabaseAdmin
        .from("ai_challenge_runs")
        .update({
          status: "completed",
          provider: generated.provider,
          model: generated.model,
          result: { rawText: generated.text },
        })
        .eq("id", runRow.id);

      await finalizeAiCredits({
        attemptId: String(reserve.attemptId),
        sourceId: assessmentRow.id,
        resultPayload: { runId: runRow.id, challengeCount: normalized.length },
      });

      const response = {
        success: true,
        assessmentId: assessmentRow.id,
        runId: runRow.id,
        challenges: normalized.map((item) => ({
          title: item.title,
          level: item.level,
          explanation: item.explanation,
          suggestions: item.suggestions,
          theme: String((item?.details as Record<string, unknown>)?.theme || item?.theme || ""),
          reason: String((item?.details as Record<string, unknown>)?.reason || item?.reason || ""),
        })),
      };

      await writeAnalyticsEvent({
        userId: user.id,
        eventType: "key_challenges.generated",
        planId: String((status?.entitlement as Record<string, unknown>)?.plan || ""),
        amount: 2,
        metadata: { assessmentId: assessmentRow.id },
      });
      await completeIdempotency({
        scope: "key_challenge_generation",
        key: idempotencyKey,
        response,
        resourceType: "ai_challenge_run",
        resourceId: runRow.id,
      });
      await writeAuditLog({
        userId: user.id,
        action: "ai.key_challenges.generated",
        metadata: { assessmentId: assessmentRow.id, runId: runRow.id },
        ipAddress: getIpAddress(req),
        userAgent: getUserAgent(req),
      });
      return json(response, { headers: corsHeaders });
    } catch (generationError) {
      await releaseAiCredits({
        attemptId: String(reserve.attemptId),
        errorMessage: generationError instanceof Error ? generationError.message : "AI generation failed.",
      });
      await supabaseAdmin
        .from("ai_challenge_runs")
        .update({
          status: "failed",
          result: { error: generationError instanceof Error ? generationError.message : "AI generation failed." },
        })
        .eq("id", runRow.id);
      await failIdempotency({
        scope: "key_challenge_generation",
        key: idempotencyKey,
        response: { success: false, message: generationError instanceof Error ? generationError.message : "AI generation failed." },
      });
      throw generationError;
    }
  } catch (error) {
    await writeObservabilityEvent({
      eventType: "ai.error",
      severity: "error",
      metadata: { message: error instanceof Error ? error.message : "Unknown AI error" },
    });
    if (error instanceof Response) return error;
    return errorResponse(500, error instanceof Error ? error.message : "Unable to complete AI request.", undefined, { headers: corsHeaders });
  }
});
