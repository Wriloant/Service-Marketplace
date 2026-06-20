"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "customer", business_name: "",
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const body: any = { ...form };
      if (body.role !== "vendor") delete body.business_name;
      const role = await register(body);
      router.push(role === "vendor" ? "/vendor" : "/");
    } catch (e: any) {
      setErr(e.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto bg-white p-6 rounded-lg border border-gray-200 mt-8">
      <h1 className="text-xl font-bold mb-4">Create account</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Full name"
          value={form.name} onChange={(e) => set("name", e.target.value)} required />
        <input className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Email"
          type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
        <input className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Password (min 6)"
          type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required />

        <div className="flex gap-2">
          {["customer", "vendor"].map((r) => (
            <button type="button" key={r} onClick={() => set("role", r)}
              className={`flex-1 py-2 rounded-md border text-sm capitalize ${
                form.role === r ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white text-gray-600 border-gray-300"}`}>
              {r === "customer" ? "Customer" : "Vendor"}
            </button>
          ))}
        </div>

        {form.role === "vendor" && (
          <input className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Business name"
            value={form.business_name} onChange={(e) => set("business_name", e.target.value)} required />
        )}

        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button disabled={busy} className="w-full bg-indigo-600 text-white py-2 rounded-md disabled:opacity-60">
          {busy ? "…" : "Sign up"}
        </button>
      </form>
      <p className="text-sm text-gray-500 mt-4">
        Have an account? <Link href="/login" className="text-indigo-600">Log in</Link>
      </p>
    </div>
  );
}
