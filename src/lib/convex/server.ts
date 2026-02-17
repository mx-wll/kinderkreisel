import { ConvexHttpClient } from "convex/browser";

function getClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  return new ConvexHttpClient(url);
}

export async function convexQuery<T>(name: string, args: Record<string, unknown> = {}) {
  const client = getClient();
  return (await client.query(name as never, args as never)) as T;
}

export async function convexMutation<T>(name: string, args: Record<string, unknown> = {}) {
  const client = getClient();
  return (await client.mutation(name as never, args as never)) as T;
}
