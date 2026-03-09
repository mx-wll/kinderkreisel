"use client";

import { useEffect, useState } from "react";
import { Copy, MessageCircleMore, X } from "lucide-react";
import { toast } from "sonner";
import type { ReferralSummary } from "@/lib/types/database";
import { buildReferralShareMessage, } from "@/lib/referrals";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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

export function InviteFriendsDialog({
  trigger,
  title = "Freunde einladen",
  description = "Mehr Familien in deiner Naehe bedeuten mehr passende Teile, schnellere Abholung und einen staerkeren lokalen Kreis.",
  dismissKey,
  className,
}: InviteFriendsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState<ShareChannel | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!dismissKey) return;
    setIsDismissed(window.localStorage.getItem(dismissKey) === "1");
  }, [dismissKey]);

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
      await navigator.clipboard.writeText(payload.shareUrl);
      toast.success("Link kopiert.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Einladung konnte nicht kopiert werden.");
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
            <h3 className="text-base font-semibold text-teal-950">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-teal-950/85">{description}</p>
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

        <div className="mt-4">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Freunde privat einladen</DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <div className="rounded-2xl border bg-muted/40 p-3">
                  <p className="text-sm font-medium">Warum das hilft</p>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Button type="button" onClick={handleWhatsapp} disabled={isCreating !== null}>
                    <MessageCircleMore className="mr-2 h-4 w-4" />
                    {isCreating === "whatsapp" ? "Erstelle..." : "WhatsApp"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCopy} disabled={isCreating !== null}>
                    <Copy className="mr-2 h-4 w-4" />
                    {isCreating === "copy_link" ? "Erstelle..." : "Link kopieren"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
