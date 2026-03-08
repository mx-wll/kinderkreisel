import { ProfileCard } from "@/components/profile-card";
import type { ProfileWithItemCount } from "@/lib/types/database";
import { convexQuery } from "@/lib/convex/server";

export default async function ProfilesPage() {
  const profiles = await convexQuery<
    Array<{
      id: string;
      name: string;
      surname?: string;
      zipCode?: string;
      phone?: string;
      addressLine1?: string;
      addressLine2?: string;
      avatarUrl?: string;
      phoneConsent: boolean;
      emailNotifications: boolean;
      onboardingCompletedAt?: number;
      lastMessageEmailAt: number;
      createdAt: number;
      updatedAt: number;
    }>
  >("profiles:list");

  const items = await convexQuery<Array<{ sellerId: string }>>("items:listAvailable", { limit: 5000 });
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item.sellerId, (counts.get(item.sellerId) ?? 0) + 1);

  const typedProfiles: ProfileWithItemCount[] = profiles.map((p) => ({
    id: p.id,
    name: p.name,
    surname: p.surname ?? null,
    zip_code: p.zipCode ?? null,
    phone: p.phone ?? null,
    address_line_1: p.addressLine1 ?? null,
    address_line_2: p.addressLine2 ?? null,
    avatar_url: p.avatarUrl ?? null,
    phone_consent: p.phoneConsent,
    email_notifications: p.emailNotifications,
    onboarding_completed_at: p.onboardingCompletedAt ? new Date(p.onboardingCompletedAt).toISOString() : null,
    last_message_email_at: new Date(p.lastMessageEmailAt).toISOString(),
    created_at: new Date(p.createdAt).toISOString(),
    updated_at: new Date(p.updatedAt).toISOString(),
    item_count: counts.get(p.id) ?? 0,
  }));
  typedProfiles.sort((a, b) => b.item_count - a.item_count);

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight">Nachbarn</h1>
      <p className="mt-1 text-sm text-muted-foreground">Schau, wer noch dabei ist.</p>

      {typedProfiles.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <p className="text-muted-foreground">Noch keine Nutzer registriert.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {typedProfiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}
    </div>
  );
}
