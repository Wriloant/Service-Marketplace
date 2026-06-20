"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const role = await login(email, password);
      const next = params.get("next");
      router.push(next || (role === "vendor" ? "/vendor" : role === "admin" ? "/admin" : "/"));
    } catch (e: any) {
      setErr(e.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto bg-white p-6 rounded-lg border border-gray-200 mt-8">
      <h1 className="text-xl font-bold mb-4">Log in</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Email"
          type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Password"
          type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button disabled={busy} className="w-full bg-indigo-600 text-white py-2 rounded-md disabled:opacity-60">
          {busy ? "…" : "Log in"}
        </button>
      </form>
      <p className="text-sm text-gray-500 mt-4">
        No account? <Link href="/register" className="text-indigo-600">Sign up</Link>
      </p>
      <p className="text-xs text-gray-400 mt-3">
        Demo: admin@market.com / clean@market.com / customer@market.com (see seed output)
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-gray-400">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
