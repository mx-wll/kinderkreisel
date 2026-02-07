import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function DELETE() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Clean up storage (avatars and item images)
  const { data: items } = await supabase
    .from("items")
    .select("image_url")
    .eq("seller_id", user.id);

  if (items && items.length > 0) {
    const paths = items.map((item) => item.image_url);
    await supabase.storage.from("items").remove(paths);
  }

  // Remove avatar
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  if (profile?.avatar_url) {
    await supabase.storage.from("avatars").remove([profile.avatar_url]);
  }

  // Delete auth user (requires service role)
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await adminClient.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json(
      { error: "Account deletion failed" },
      { status: 500 }
    );
  }

  // Sign out the current session
  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
