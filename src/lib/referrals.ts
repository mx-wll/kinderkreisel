export const REFERRAL_INVITE_COOKIE = "kk_referral_invite";

export function getReferralCookieMaxAge() {
  return 60 * 60 * 24 * 30;
}

export function buildReferralShareMessage(shareUrl: string) {
  return [
    "Ich bin bei findln dabei. Das ist ein lokaler Kreis fuer Kinderartikel in der Nachbarschaft.",
    "Wenn du magst, komm dazu. So tauchen mehr passende Sachen direkt in der Naehe auf.",
    shareUrl,
    "Bitte nur an Leute schicken, die du kennst.",
  ].join("\n\n");
}
