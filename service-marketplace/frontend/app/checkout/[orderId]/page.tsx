"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Api } from "@/lib/api";

const TEST_CARDS = [
  { token: "tok_success", label: "Approved (tok_success)" },
  { token: "tok_fail", label: "Declined (tok_fail)" },
];

export default function Checkout() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [card, setCard] = useState("tok_success");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Api.order(orderId).then(setOrder).catch((e) => setErr(e.message));
  }, [orderId]);

  async function pay() {
    setErr(""); setBusy(true);
    try {
      await Api.payOrder(orderId, card);
      router.push("/orders?paid=1");
    } catch (e: any) {
      setErr(e.message || "Payment failed");
      Api.order(orderId).then(setOrder).catch(() => {});
    } finally {
      setBusy(false);
    }
  }

  if (err && !order) return <p className="text-red-600">{err}</p>;
  if (!order) return <p className="text-gray-400">Loading…</p>;

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h1 className="text-xl font-bold mb-4">Checkout</h1>

        <div className="bg-gray-50 rounded-md p-4 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Service</span>
            <span className="font-medium">{order.service?.title}</span></div>
          <div className="flex justify-between mt-1"><span className="text-gray-500">Vendor</span>
            <span>{order.service?.vendor?.business_name}</span></div>
          <div className="flex justify-between mt-1"><span className="text-gray-500">Order #</span>
            <span>{order.id}</span></div>
          <div className="flex justify-between mt-3 pt-3 border-t text-base">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-indigo-600">৳ {order.amount}</span>
          </div>
        </div>

        {order.status === "paid" ? (
          <p className="text-green-600 mt-4 font-medium">✓ This order is already paid.</p>
        ) : (
          <>
            <label className="block text-sm text-gray-500 mt-5 mb-1">Sandbox test card</label>
            <select value={card} onChange={(e) => setCard(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white">
              {TEST_CARDS.map((c) => <option key={c.token} value={c.token}>{c.label}</option>)}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              No real charge — this hits the mock gateway in the backend.
            </p>
            {err && <p className="text-red-600 text-sm mt-2">{err}</p>}
            <button onClick={pay} disabled={busy}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-md mt-4 disabled:opacity-60">
              {busy ? "Processing…" : `Pay ৳ ${order.amount}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
