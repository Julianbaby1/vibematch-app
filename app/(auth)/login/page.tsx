"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { setSupabaseAuthCookies } from "../../../lib/authCookies";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setSupabaseAuthCookies(data.session);
      router.replace("/dashboard");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-lg">
        <h1 className="text-3xl font-semibold">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-400">
          Sign in to keep matching with your favorite vibes.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleLogin}>
          <label className="block text-sm text-slate-300">
            Email
            <input
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100 outline-none focus:border-indigo-500"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="block text-sm text-slate-300">
            Password
            <input
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100 outline-none focus:border-indigo-500"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          {message && <p className="text-sm text-rose-400">{message}</p>}

          <button
            className="w-full rounded-lg bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          New here?{" "}
          <a className="text-indigo-400 hover:text-indigo-300" href="/signup">
            Create an account
          </a>
        </p>
      </div>
    </main>
  );
}
