import { convexClientMutation, convexClientQuery } from "@/lib/convex/client";

export async function uploadFileToConvex(file: File): Promise<{ url: string; storageId: string }> {
  const uploadUrl = await convexClientMutation<string>("files:generateUploadUrl");
  const result = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!result.ok) throw new Error("Upload failed");
  const payload = (await result.json()) as { storageId: string };
  const url = await convexClientQuery<string | null>("files:getUrl", {
    storageId: payload.storageId,
  });
  if (!url) throw new Error("Failed to resolve storage URL");
  return { url, storageId: payload.storageId };
}
