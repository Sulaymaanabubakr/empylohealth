import { errorResponse } from "./response.ts";

const apiKey = Deno.env.get("BREVO_API_KEY") || "";
const fromEmail = Deno.env.get("BREVO_FROM_EMAIL") || "";
const fromName = Deno.env.get("BREVO_FROM_NAME") || "Circles Health App";
const supportEmail = Deno.env.get("SUPPORT_EMAIL") || "support@empylo.com";
const webUrl = Deno.env.get("APP_WEB_URL") || "https://www.empylo.com";
const privacyUrl = Deno.env.get("APP_PRIVACY_URL") || `${webUrl}/privacy`;
const termsUrl = Deno.env.get("APP_TERMS_URL") || `${webUrl}/terms`;

const escapeHtml = (raw: string): string =>
  String(raw || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildBaseTemplate = (input: {
  title: string;
  preheader?: string;
  intro: string;
  bodyHtml: string;
  securityNote?: string;
}) => {
  const safeTitle = escapeHtml(input.title);
  const safePreheader = escapeHtml(input.preheader || input.title);
  const safeIntro = escapeHtml(input.intro);
  const securityNote = input.securityNote ||
    "If you didn't request this action, secure your account immediately.";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:#F2F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${safePreheader}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F2F5F7;padding:18px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#FFFFFF;border-radius:18px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#00A99D,#00776E);padding:22px 24px;color:#FFFFFF;">
              <div style="font-size:20px;font-weight:800;letter-spacing:0.2px;">Circles Health App</div>
              <div style="font-size:13px;opacity:0.9;margin-top:4px;">Security & Account Notifications</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <h1 style="margin:0 0 10px 0;font-size:24px;line-height:1.3;color:#0F172A;">${safeTitle}</h1>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">${safeIntro}</p>
              ${input.bodyHtml}
              <div style="margin-top:26px;padding:12px 14px;border-radius:10px;background:#F8FAFC;border:1px solid #E2E8F0;font-size:13px;line-height:1.5;color:#475569;">
                ${escapeHtml(securityNote)}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 24px;background:#F8FAFC;border-top:1px solid #E2E8F0;font-size:12px;line-height:1.6;color:#64748B;">
              <div>Need help? Contact <a href="mailto:${escapeHtml(supportEmail)}" style="color:#0F766E;text-decoration:none;">${escapeHtml(supportEmail)}</a></div>
              <div style="margin-top:6px;">
                <a href="${escapeHtml(privacyUrl)}" style="color:#0F766E;text-decoration:none;">Privacy</a>
                &nbsp;•&nbsp;
                <a href="${escapeHtml(termsUrl)}" style="color:#0F766E;text-decoration:none;">Terms</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const buildOtpBlock = (code: string, expiresInMinutes: number) => {
  const spacedCode = String(code || "").split("").join(" ");
  return `
  <div style="margin:18px 0 14px 0;padding:16px;border-radius:12px;background:#ECFEFF;border:1px solid #A5F3FC;">
    <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#0F766E;font-weight:700;">Your One-Time Code</div>
    <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono',monospace;font-size:34px;letter-spacing:0.28em;font-weight:800;color:#0F172A;margin-top:8px;">${escapeHtml(spacedCode)}</div>
    <div style="margin-top:8px;font-size:13px;color:#334155;">This code expires in <strong>${expiresInMinutes} minutes</strong>.</div>
  </div>`;
};

const purposeLabelMap: Record<string, string> = {
  SIGNUP_VERIFY: "Sign Up",
  RESET_PASSWORD: "Password Reset",
  CHANGE_PASSWORD: "Password Change",
  EMAIL_VERIFY: "Email Verification",
  CHANGE_EMAIL: "Email Change",
};

const buildOtpTemplate = (purpose: string, code: string, expiresInMinutes: number) => {
  const purposeLabel = purposeLabelMap[String(purpose || "").toUpperCase()] || "Verification";
  return {
    subject: `${purposeLabel} code for Circles Health App`,
    htmlContent: buildBaseTemplate({
      title: `${purposeLabel} Verification`,
      preheader: `Your verification code is ${code}`,
      intro: `Use the one-time code below to continue your ${purposeLabel.toLowerCase()} request.`,
      bodyHtml: buildOtpBlock(code, expiresInMinutes),
      securityNote: "Never share this code with anyone. Circles support will never ask for your OTP.",
    }),
    textContent: `${purposeLabel} code: ${code}. Expires in ${expiresInMinutes} minutes.`,
  };
};

export const sendOtpEmail = async (email: string, purpose: string, code: string) => {
  if (!apiKey || !fromEmail) {
    throw errorResponse(500, "Brevo is not configured.");
  }

  const template = buildOtpTemplate(purpose, code, 10);
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { email: fromEmail, name: fromName },
      to: [{ email }],
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      tags: ["otp", String(purpose || "").toLowerCase()],
    }),
  });

  if (!response.ok) {
    const payload = await response.text().catch(() => "");
    throw new Error(`Brevo send failed (${response.status}): ${payload}`);
  }
};
