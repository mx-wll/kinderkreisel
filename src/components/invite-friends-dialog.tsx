"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, MessageCircleMore, Share2, X } from "lucide-react";
import { toast } from "sonner";
import type { ReferralSummary } from "@/lib/types/database";
import { buildReferralShareMessage, } from "@/lib/referrals";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type InviteFriendsDialogProps = {
  trigger: React.ReactNode;
  title?: string;
  description?: string;
  shareReason?: string;
  summary: ReferralSummary;
  compact?: boolean;
  dismissKey?: string;
  className?: string;
};

type ShareChannel = "whatsapp" | "copy_link" | "native_share";

function formatStatus(status: ReferralSummary["recent"][number]["status"]) {
  switch (status) {
    case "activated":
      return "Aktiv";
    case "signed_up":
      return "Angemeldet";
    default:
      return "Eingeladen";
  }
}

export function InviteFriendsDialog({
  trigger,
  title = "Freunde einladen",
  description = "Mehr Familien in deiner Naehe bedeuten mehr passende Teile, schnellere Abholung und einen staerkeren lokalen Kreis.",
  shareReason = "Bitte nur an Leute schicken, die du kennst.",
  summary,
  compact = false,
  dismissKey,
  className,
}: InviteFriendsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState<ShareChannel | null>(null);
  const [shareText, setShareText] = useState("");
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!dismissKey) return;
    setIsDismissed(window.localStorage.getItem(dismissKey) === "1");
  }, [dismissKey]);

  const perkLabel = useMemo(() => {
    if (summary.hasSupporterBadge) {
      return "Dein Unterstuetzer-Badge ist freigeschaltet.";
    }
    if (summary.nextPerkAt === 1) {
      return "Die erste aktivierte Einladung schaltet dein Unterstuetzer-Badge frei.";
    }
    return "Einladungen helfen, mehr passende Familien in deiner Naehe sichtbar zu machen.";
  }, [summary]);

  async function createInvite(channel: ShareChannel) {
    setIsCreating(channel);
    try {
      const response = await fetch("/api/referrals/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        shareUrl?: string;
      };
      if (!response.ok || !body.shareUrl) {
        throw new Error(body.error || "Einladung konnte nicht erstellt werden.");
      }
      const message = buildReferralShareMessage(body.shareUrl);
      setShareText(message);
      return { shareUrl: body.shareUrl, message };
    } finally {
      setIsCreating(null);
    }
  }

  async function handleWhatsapp() {
    try {
      const payload = await createInvite("whatsapp");
      const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(payload.message)}`;
      window.open(whatsappShareUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "WhatsApp konnte nicht geoeffnet werden.");
    }
  }

  async function handleCopy() {
    try {
      const payload = await createInvite("copy_link");
      await navigator.clipboard.writeText(payload.message);
      toast.success("Einladung kopiert.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Einladung konnte nicht kopiert werden.");
    }
  }

  async function handleNativeShare() {
    try {
      const payload = await createInvite("native_share");
      if (navigator.share) {
        await navigator.share({
          title: "findln Einladung",
          text: payload.message,
          url: payload.shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(payload.message);
        toast.success("Dein Geraet hat kein Teilen-Menue. Die Einladung wurde kopiert.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Teilen ist fehlgeschlagen.");
    }
  }

  function handleDismiss() {
    if (!dismissKey) return;
    window.localStorage.setItem(dismissKey, "1");
    setIsDismissed(true);
  }

  if (isDismissed) {
    return null;
  }

  return (
    <div className={className}>
      <div className="rounded-2xl border border-teal-200/70 bg-teal-50/70 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-teal-950">{title}</h3>
              {summary.hasSupporterBadge && (
                <Badge className="rounded-full bg-teal-700 text-white">Unterstuetzer*in</Badge>
              )}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-teal-950/85">{description}</p>
            <p className="mt-2 text-xs text-teal-950/70">{perkLabel}</p>
          </div>
          {dismissKey && (
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-full p-1 text-teal-900/60 transition-colors hover:bg-teal-100 hover:text-teal-950"
              aria-label="Einladung ausblenden"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <div className="rounded-xl bg-white/80 px-3 py-2">
            <p className="text-xs text-muted-foreground">Verschickt</p>
            <p className="font-semibold">{summary.inviteCount}</p>
          </div>
          <div className="rounded-xl bg-white/80 px-3 py-2">
            <p className="text-xs text-muted-foreground">Angemeldet</p>
            <p className="font-semibold">{summary.signedUpCount}</p>
          </div>
          <div className="rounded-xl bg-white/80 px-3 py-2">
            <p className="text-xs text-muted-foreground">Aktiv</p>
            <p className="font-semibold">{summary.activatedCount}</p>
          </div>
        </div>

        {!compact && summary.recent.length > 0 && (
          <div className="mt-4 space-y-2">
            {summary.recent.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-xl bg-white/75 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{invite.invitedName ?? "Noch anonym"}</p>
                  <p className="text-xs text-muted-foreground">
                    {invite.channel ? invite.channel.replace("_", " ") : "Direktlink"}
                  </p>
                </div>
                <Badge variant="outline">{formatStatus(invite.status)}</Badge>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Freunde privat einladen</DialogTitle>
                <DialogDescription>
                  Lade nur Leute ein, die du kennst. So bleibt der Kreis lokal und vertrauensvoll.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div className="rounded-2xl border bg-muted/40 p-3">
                  <p className="text-sm font-medium">Warum das hilft</p>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{shareReason}</p>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <Button type="button" onClick={handleWhatsapp} disabled={isCreating !== null}>
                    <MessageCircleMore className="mr-2 h-4 w-4" />
                    {isCreating === "whatsapp" ? "Erstelle..." : "WhatsApp"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCopy} disabled={isCreating !== null}>
                    <Copy className="mr-2 h-4 w-4" />
                    {isCreating === "copy_link" ? "Erstelle..." : "Link kopieren"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleNativeShare} disabled={isCreating !== null}>
                    <Share2 className="mr-2 h-4 w-4" />
                    {isCreating === "native_share" ? "Erstelle..." : "Mehr"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Nachricht</p>
                  <Textarea
                    value={shareText}
                    onChange={(event) => setShareText(event.target.value)}
                    placeholder="Beim ersten Klick auf einen Kanal wird hier deine Einladung vorbereitet."
                    rows={6}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
