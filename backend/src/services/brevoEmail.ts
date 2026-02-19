import * as functions from 'firebase-functions/v1';

type Recipient = {
  email: string;
  name?: string;
};

type Action = {
  label: string;
  url: string;
};

type MailTemplateInput = {
  title: string;
  preheader?: string;
  intro: string;
  bodyHtml: string;
  action?: Action;
  securityNote?: string;
  supportEmail?: string;
};

type SendMailInput = {
  to: Recipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  tags?: string[];
};

const DEFAULT_SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@empylo.com';
const DEFAULT_FROM_EMAIL = process.env.BREVO_FROM_EMAIL || 'noreply@empylo.com';
const DEFAULT_FROM_NAME = process.env.BREVO_FROM_NAME || 'Circles Health App';
const DEFAULT_WEB_URL = process.env.APP_WEB_URL || 'https://www.empylo.com';
const DEFAULT_PRIVACY_URL = process.env.APP_PRIVACY_URL || `${DEFAULT_WEB_URL}/privacy`;
const DEFAULT_TERMS_URL = process.env.APP_TERMS_URL || `${DEFAULT_WEB_URL}/terms`;

const escapeHtml = (raw: string): string => String(raw || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const buildBaseTemplate = (input: MailTemplateInput): string => {
  const supportEmail = input.supportEmail || DEFAULT_SUPPORT_EMAIL;
  const safeTitle = escapeHtml(input.title);
  const safePreheader = escapeHtml(input.preheader || input.title);
  const safeIntro = escapeHtml(input.intro);
  const securityNote = input.securityNote || "If you didn't request this action, secure your account immediately.";

  const actionHtml = input.action
    ? `<p style="margin:24px 0 0 0; text-align:center;"><a href="${escapeHtml(input.action.url)}" style="display:inline-block;background:#00A99D;color:#FFFFFF;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:700;">${escapeHtml(input.action.label)}</a></p>`
    : '';

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
              ${actionHtml}
              <div style="margin-top:26px;padding:12px 14px;border-radius:10px;background:#F8FAFC;border:1px solid #E2E8F0;font-size:13px;line-height:1.5;color:#475569;">
                ${escapeHtml(securityNote)}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 24px;background:#F8FAFC;border-top:1px solid #E2E8F0;font-size:12px;line-height:1.6;color:#64748B;">
              <div>Need help? Contact <a href="mailto:${escapeHtml(supportEmail)}" style="color:#0F766E;text-decoration:none;">${escapeHtml(supportEmail)}</a></div>
              <div style="margin-top:6px;">
                <a href="${escapeHtml(DEFAULT_PRIVACY_URL)}" style="color:#0F766E;text-decoration:none;">Privacy</a>
                &nbsp;•&nbsp;
                <a href="${escapeHtml(DEFAULT_TERMS_URL)}" style="color:#0F766E;text-decoration:none;">Terms</a>
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

const buildOtpBlock = (code: string, expiresInMinutes: number): string => {
  const spacedCode = code.split('').join(' ');
  return `
  <div style="margin:18px 0 14px 0;padding:16px;border-radius:12px;background:#ECFEFF;border:1px solid #A5F3FC;">
    <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#0F766E;font-weight:700;">Your One-Time Code</div>
    <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono',monospace;font-size:34px;letter-spacing:0.28em;font-weight:800;color:#0F172A;margin-top:8px;">${escapeHtml(spacedCode)}</div>
    <div style="margin-top:8px;font-size:13px;color:#334155;">This code expires in <strong>${expiresInMinutes} minutes</strong>.</div>
  </div>`;
};

export const mailTemplates = {
  otp: (params: { purposeLabel: string; code: string; expiresInMinutes: number }) => {
    const subject = `${params.purposeLabel} code for Circles Health App`;
    const bodyHtml = buildOtpBlock(params.code, params.expiresInMinutes);
    const htmlContent = buildBaseTemplate({
      title: `${params.purposeLabel} Verification`,
      preheader: `Your verification code is ${params.code}`,
      intro: `Use the one-time code below to continue your ${params.purposeLabel.toLowerCase()} request.`,
      bodyHtml,
      securityNote: "Never share this code with anyone. Circles support will never ask for your OTP."
    });
    const textContent = `${params.purposeLabel} code: ${params.code}. Expires in ${params.expiresInMinutes} minutes.`;
    return { subject, htmlContent, textContent };
  },

  newLogin: (params: { deviceLabel: string; signedInAtIso: string; locationText: string; secureUrl: string }) => {
    const subject = 'New sign-in detected on your Circles account';
    const bodyHtml = `
      <p style="margin:0 0 8px 0;font-size:14px;color:#334155;">We noticed a sign-in from a new device:</p>
      <ul style="margin:0 0 0 18px;padding:0;color:#0F172A;font-size:14px;line-height:1.7;">
        <li><strong>Device:</strong> ${escapeHtml(params.deviceLabel)}</li>
        <li><strong>Time:</strong> ${escapeHtml(params.signedInAtIso)}</li>
        <li><strong>Location:</strong> ${escapeHtml(params.locationText)}</li>
      </ul>`;
    const htmlContent = buildBaseTemplate({
      title: 'New Login Detected',
      intro: 'A new sign-in was detected on your account.',
      bodyHtml,
      action: { label: 'Secure My Account', url: params.secureUrl }
    });
    return { subject, htmlContent };
  },

  passwordChanged: () => {
    const subject = 'Your password was changed';
    const htmlContent = buildBaseTemplate({
      title: 'Password Changed',
      intro: 'Your Circles password was changed successfully.',
      bodyHtml: '<p style="margin:0;font-size:14px;color:#334155;">If this was not you, reset your password immediately and contact support.</p>',
      action: { label: 'Review Account Security', url: `${DEFAULT_WEB_URL}/security` }
    });
    return { subject, htmlContent };
  },

  passwordResetRequested: () => {
    const subject = 'Password reset requested';
    const htmlContent = buildBaseTemplate({
      title: 'Password Reset Requested',
      intro: 'A password reset request was received for your account.',
      bodyHtml: '<p style="margin:0;font-size:14px;color:#334155;">Use the OTP code we sent in this flow to complete your password reset.</p>'
    });
    return { subject, htmlContent };
  },

  accountDeleted: () => {
    const subject = 'Your Circles account was deleted';
    const htmlContent = buildBaseTemplate({
      title: 'Account Deleted',
      intro: 'Your Circles account deletion is complete.',
      bodyHtml: '<p style="margin:0;font-size:14px;color:#334155;">We are sorry to see you go. If this was unauthorized, contact support immediately.</p>'
    });
    return { subject, htmlContent };
  },

  circleDeleted: (params: { circleName: string }) => {
    const subject = `Circle deleted: ${params.circleName}`;
    const htmlContent = buildBaseTemplate({
      title: 'Circle Deleted',
      intro: `The circle "${params.circleName}" has been deleted by an administrator or owner.`,
      bodyHtml: '<p style="margin:0;font-size:14px;color:#334155;">Any associated circle chat and activities are no longer available.</p>'
    });
    return { subject, htmlContent };
  }
};

export const sendBrevoEmail = async (input: SendMailInput): Promise<void> => {
  const apiKey = process.env.BREVO_API_KEY || '';
  if (!apiKey) {
    throw new functions.https.HttpsError('failed-precondition', 'Brevo API key is not configured.');
  }

  const to = input.to
    .map((recipient) => ({ email: String(recipient.email || '').trim(), name: recipient.name || undefined }))
    .filter((recipient) => !!recipient.email);

  if (to.length === 0) {
    return;
  }

  const payload = {
    sender: {
      name: DEFAULT_FROM_NAME,
      email: DEFAULT_FROM_EMAIL
    },
    to,
    subject: input.subject,
    htmlContent: input.htmlContent,
    textContent: input.textContent || undefined,
    tags: input.tags || undefined
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[Brevo] send failed', { status: response.status, body: text });
    throw new functions.https.HttpsError('internal', `Brevo send failed (${response.status}).`);
  }
};

export const sendTemplateEmail = async (params: {
  to: Recipient[];
  template: { subject: string; htmlContent: string; textContent?: string };
  tags?: string[];
}) => {
  const payload: SendMailInput = {
    to: params.to,
    subject: params.template.subject,
    htmlContent: params.template.htmlContent,
    ...(params.template.textContent ? { textContent: params.template.textContent } : {}),
    ...(params.tags ? { tags: params.tags } : {})
  };

  await sendBrevoEmail(payload);
};
