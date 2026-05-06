import { createClient } from "@supabase/supabase-js";
import { SERVER_ENV } from "../config";

export function createServerSupabaseClient(accessToken?: string) {
  return createClient(SERVER_ENV.SUPABASE_URL, SERVER_ENV.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}

export async function getAuthenticatedUser(accessToken: string) {
  const client = createServerSupabaseClient(accessToken);
  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user) {
    throw new Error("Sesion invalida o expirada.");
  }
  return data.user;
}
