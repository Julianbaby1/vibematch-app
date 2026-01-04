import type { Session } from "@supabase/supabase-js";

const ACCESS_TOKEN_COOKIE = "sb-access-token";
const REFRESH_TOKEN_COOKIE = "sb-refresh-token";

export const setSupabaseAuthCookies = (session: Session | null) => {
  if (!session) return;
  const { access_token: accessToken, refresh_token: refreshToken } = session;

  document.cookie = `${ACCESS_TOKEN_COOKIE}=${accessToken}; path=/; samesite=lax`;
  document.cookie = `${REFRESH_TOKEN_COOKIE}=${refreshToken}; path=/; samesite=lax`;
};

export const clearSupabaseAuthCookies = () => {
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = `${REFRESH_TOKEN_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};
