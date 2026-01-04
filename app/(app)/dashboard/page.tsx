import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabaseServer";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const cookieStore = cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  if (!accessToken) {
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    redirect("/login");
  }

  return <DashboardClient userEmail={data.user.email ?? ""} />;
}
