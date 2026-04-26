import { createClient } from "@supabase/supabase-js";

const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(projectUrl && publicKey);

export const supabase = isSupabaseConfigured ? createClient(projectUrl, publicKey) : null;
