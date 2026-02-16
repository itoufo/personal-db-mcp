import { getClient } from "../db/client.js";

let cachedProfileId: string | null = null;

/** Resolve the single profile ID (personal DB = one person) */
export async function getProfileId(): Promise<string> {
  if (cachedProfileId) return cachedProfileId;

  const { data, error } = await getClient()
    .from("profiles")
    .select("id")
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error("No profile found. Create a profile first using create_profile.");
  }

  cachedProfileId = data.id as string;
  return cachedProfileId!;
}

/** Clear cached profile ID (used after profile creation) */
export function clearProfileCache(): void {
  cachedProfileId = null;
}
