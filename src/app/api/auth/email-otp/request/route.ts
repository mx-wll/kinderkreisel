import { createHash, randomInt } from "crypto";
import { NextResponse } from "next/server";
import { convexMutation, convexQuery } from "@/lib/convex/server";
import { ResendSendError, sendResendEmail } from "@/lib/email/resend";

function generateCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    name?: string;
    surname?: string;
  };
  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "E-Mail fehlt." }, { status: 400 });
  }

  const authUser = await convexQuery<{ email: string } | null>("auth:getAuthUserByEmail", { email });
  if (!authUser && !body.name?.trim()) {
    return NextResponse.json(
      { error: "Für neue Konten brauchen wir mindestens deinen Namen." },
      { status: 400 }
    );
  }

  const code = generateCode();
  const codeHash = createHash("sha256").update(code).digest("hex");
  await convexMutation("auth:createEmailLoginCode", {
    email,
    codeHash,
    name: body.name,
    surname: body.surname,
    expiresAt: Date.now() + 1000 * 60 * 15,
  });

  try {
    await sendResendEmail({
      to: email,
      subject: "Dein Anmeldecode für findln",
      html: `<p>Dein Code für findln lautet:</p><p style="font-size:24px;font-weight:700;letter-spacing:0.3em;">${code}</p><p>Der Code ist 15 Minuten gültig.</p>`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (process.env.NODE_ENV !== "production" && error instanceof ResendSendError && error.message === "RESEND_NOT_CONFIGURED") {
      return NextResponse.json({ success: true, devCode: code });
    }
    if (
      error instanceof ResendSendError &&
      ["RESEND_NOT_CONFIGURED", "RESEND_FROM_EMAIL_MISSING", "RESEND_FROM_EMAIL_INVALID"].includes(error.message)
    ) {
      return NextResponse.json(
        { error: "E-Mail-Versand ist aktuell nicht korrekt konfiguriert." },
        { status: 503 }
      );
    }
    if (error instanceof ResendSendError && error.message.startsWith("RESEND_SEND_FAILED:")) {
      console.error("[auth/email-otp/request] resend send failed", {
        status: error.status,
        detail: error.detail,
      });
    }
    return NextResponse.json({ error: "Der Code konnte nicht gesendet werden." }, { status: 502 });
  }
}
