type ResendConfig = {
  apiKey: string;
  from: string;
};

type ResendSendErrorCode =
  | "RESEND_NOT_CONFIGURED"
  | "RESEND_FROM_EMAIL_MISSING"
  | "RESEND_FROM_EMAIL_INVALID";

export class ResendSendError extends Error {
  status?: number;
  detail?: string;

  constructor(message: ResendSendErrorCode | `RESEND_SEND_FAILED:${number}`, detail?: string) {
    super(message);
    this.name = "ResendSendError";
    this.detail = detail;
  }
}

function truncate(value: string, max = 400) {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
}

function getResendConfig(): ResendConfig {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new ResendSendError("RESEND_NOT_CONFIGURED");

  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const isProduction = process.env.NODE_ENV === "production";

  if (!from) {
    if (isProduction) throw new ResendSendError("RESEND_FROM_EMAIL_MISSING");
    return {
      apiKey,
      from: "findln <onboarding@resend.dev>",
    };
  }

  if (isProduction && from.toLowerCase().includes("@resend.dev")) {
    throw new ResendSendError(
      "RESEND_FROM_EMAIL_INVALID",
      "Production email sender must use a verified non-resend.dev domain."
    );
  }

  return { apiKey, from };
}

export async function sendResendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const { apiKey, from } = getResendConfig();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const detail = truncate(await res.text());
    const error = new ResendSendError(`RESEND_SEND_FAILED:${res.status}`, detail);
    error.status = res.status;
    throw error;
  }
}
