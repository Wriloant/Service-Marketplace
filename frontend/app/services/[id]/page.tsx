"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { role, ready } = useAuth();
  const [s, setS] = useState<any>(null);
  const [address, setAddress] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Api.service(id).then(setS).catch((e) => setErr(e.message));
  }, [id]);

  async function book(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const order: any = await Api.createOrder({ service_id: Number(id), address });
      router.push(`/checkout/${order.id}`);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (err && !s) return <p className="text-red-600">{err}</p>;
  if (!s) return <p className="text-gray-400">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <Link href="/" className="text-sm text-indigo-600">← Back to marketplace</Link>
      <div className="bg-white rounded-lg border border-gray-200 p-6 mt-3">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{s.title}</h1>
          <span className="text-2xl font-bold text-indigo-600">৳ {s.price}</span>
        </div>
        <div className="flex gap-2 mt-2 text-sm text-gray-500">
          <span className="bg-gray-100 px-2 py-0.5 rounded-full">{s.category?.name}</span>
          <span>by {s.vendor?.business_name}</span>
          <span>· {s.duration_minutes} min</span>
        </div>
        <p className="text-gray-700 mt-4">{s.description}</p>

        <hr className="my-5 border-gray-100" />

        {!ready ? null : role === "customer" ? (
          <form onSubmit={book} className="space-y-3">
            <h2 className="font-semibold">Book this service</h2>
            <input className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Service address" value={address}
              onChange={(e) => setAddress(e.target.value)} required />
            {err && <p className="text-red-600 text-sm">{err}</p>}
            <button disabled={busy} className="bg-indigo-600 text-white px-5 py-2 rounded-md disabled:opacity-60">
              {busy ? "…" : "Book & checkout"}
            </button>
          </form>
        ) : role ? (
          <p className="text-gray-500 text-sm">Only customers can book services.</p>
        ) : (
          <p className="text-gray-600 text-sm">
            <Link href="/login" className="text-indigo-600">Log in</Link> as a customer to book.
          </p>
        )}
      </div>
    </div>
  );
}
