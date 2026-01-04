"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { clearSupabaseAuthCookies } from "../../../lib/authCookies";

interface DashboardClientProps {
  userEmail: string;
}

export default function DashboardClient({ userEmail }: DashboardClientProps) {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (!data.session) {
        clearSupabaseAuthCookies();
        router.replace("/login");
        return;
      }

      setCheckingSession(false);
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    clearSupabaseAuthCookies();
    router.replace("/login");
  };

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-slate-400">Checking your session...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-16">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-10 shadow-xl">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="mt-3 text-slate-300">
          You are signed in as <span className="text-white">{userEmail}</span>.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          This is your protected space. Add personalized content here.
        </p>

        <button
          className="mt-8 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-slate-500"
          type="button"
          onClick={handleSignOut}
        >
          Sign out
        </button>
      </div>
    </main>
  );
}
