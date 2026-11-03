/**
 * Lightweight Supabase REST PostgREST Client
 * Works in both Next.js Web and Capacitor Mobile App builds without extra native binaries.
 * Automatically activates when NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are configured.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

export function isSupabaseConfigured(): boolean {
  return (
    Boolean(SUPABASE_URL) &&
    Boolean(SUPABASE_ANON_KEY) &&
    SUPABASE_URL.startsWith("http") &&
    SUPABASE_URL !== "https://your-project-id.supabase.co" &&
    SUPABASE_ANON_KEY !== "your_supabase_anon_key_here"
  );
}

function getHeaders(prefer?: string): HeadersInit {
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };
  if (prefer) {
    headers["Prefer"] = prefer;
  }
  return headers;
}

export async function supabaseSelect<T>(
  table: string,
  query = "select=*"
): Promise<T[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T[];
  } catch (e) {
    console.warn(`Supabase select error on ${table}:`, e);
    return null;
  }
}

export async function supabaseUpsert<T>(
  table: string,
  payload: T | T[]
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: getHeaders("resolution=merge-duplicates,return=minimal"),
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    console.warn(`Supabase upsert error on ${table}:`, e);
    return false;
  }
}

export async function supabaseDeleteById(
  table: string,
  id: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: getHeaders("return=minimal"),
      }
    );
    return res.ok;
  } catch (e) {
    console.warn(`Supabase delete error on ${table}:`, e);
    return false;
  }
}
