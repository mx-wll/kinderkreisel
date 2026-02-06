import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";

export default async function MyProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const name = user?.user_metadata?.name ?? "";
  const surname = user?.user_metadata?.surname ?? "";

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Mein Profil</h1>
        <LogoutButton />
      </div>

      <div className="mt-6 space-y-2">
        <p className="text-lg font-medium">
          {name} {surname}
        </p>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      <div className="mt-12 flex flex-col items-center justify-center text-center">
        <p className="text-muted-foreground">
          Profilbearbeitung kommt bald.
        </p>
      </div>
    </div>
  );
}
