/**
 * Seed script for Kinderkreisel MVP.
 *
 * Mode 1 (default): Upload stock images for all items that are missing images in storage.
 *         Uses the anon key — signs in as each seed user to upload via RLS.
 *
 * Mode 2 (--full): Creates 10 users + 150 items + uploads images.
 *         Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.
 *
 * Usage:
 *   pnpm seed              # Upload images only (users+items created via SQL)
 *   pnpm seed -- --full    # Full seed (create users, items, and images)
 *
 * All seed users share password: Test1234!
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !anonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const SEED_PASSWORD = "Test1234!";

const SEED_EMAILS = [
  "anna.huber@kinderkreisel.test",
  "thomas.müller@kinderkreisel.test",
  "lisa.bauer@kinderkreisel.test",
  "michael.wagner@kinderkreisel.test",
  "sandra.fischer@kinderkreisel.test",
  "stefan.weber@kinderkreisel.test",
  "julia.schneider@kinderkreisel.test",
  "markus.hoffmann@kinderkreisel.test",
  "katharina.koch@kinderkreisel.test",
  "daniel.richter@kinderkreisel.test",
];

async function uploadImages() {
  console.log("📸 Uploading stock images for seed items...\n");

  let totalUploaded = 0;
  let totalSkipped = 0;

  for (const email of SEED_EMAILS) {
    // Create a fresh client and sign in as this user
    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password: SEED_PASSWORD });

    if (authError || !authData.user) {
      console.error(`❌ Could not sign in as ${email}: ${authError?.message}`);
      continue;
    }

    const userId = authData.user.id;
    const name = authData.user.user_metadata?.name ?? email;
    console.log(`👤 ${name} (${email})`);

    // Get this user's items
    const { data: items, error: itemsError } = await supabase
      .from("items")
      .select("id, image_url")
      .eq("seller_id", userId);

    if (itemsError || !items) {
      console.error(`   ❌ Could not fetch items: ${itemsError?.message}`);
      continue;
    }

    let uploaded = 0;
    for (const item of items) {
      // Check if image already exists in storage
      const { data: existing } = await supabase.storage
        .from("items")
        .list(userId, { search: `${item.id}` });

      if (existing && existing.length > 0) {
        totalSkipped++;
        continue;
      }

      // Download a random stock photo from picsum
      const picsumUrl = `https://picsum.photos/seed/${item.id}/800/800`;
      try {
        const response = await fetch(picsumUrl, { redirect: "follow" });
        if (!response.ok) {
          console.error(`   ⚠️  Picsum returned ${response.status} for item ${item.id}`);
          continue;
        }

        const blob = await response.blob();
        const buffer = Buffer.from(await blob.arrayBuffer());

        const { error: uploadError } = await supabase.storage
          .from("items")
          .upload(item.image_url, buffer, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (uploadError) {
          console.error(`   ⚠️  Upload failed: ${uploadError.message}`);
          continue;
        }

        uploaded++;
        totalUploaded++;
      } catch (err) {
        console.error(`   ⚠️  Fetch failed for item ${item.id}`);
      }
    }

    console.log(`   ✅ ${uploaded} images uploaded (${items.length - uploaded} skipped)\n`);
    await supabase.auth.signOut();
  }

  console.log(`\n🎉 Done! ${totalUploaded} images uploaded, ${totalSkipped} already existed.`);
  console.log(`\n   Login with any seed user:`);
  console.log(`   Email: anna.huber@kinderkreisel.test`);
  console.log(`   Password: ${SEED_PASSWORD}`);
}

uploadImages().catch(console.error);
