"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Api } from "@/lib/api";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-gray-100 text-gray-500",
};

function OrdersList() {
  const params = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Api.myOrders().then(setOrders).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">My orders</h1>
      {params.get("paid") === "1" && (
        <div className="bg-green-50 text-green-700 border border-green-200 rounded-md px-4 py-2 mb-4 text-sm">
          ✓ Payment successful — your booking is confirmed.
        </div>
      )}
      {loading ? <p className="text-gray-400">Loading…</p>
        : orders.length === 0 ? (
          <p className="text-gray-400">No orders yet. <Link href="/" className="text-indigo-600">Browse services</Link></p>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{o.service?.title}</p>
                  <p className="text-sm text-gray-500">
                    {o.service?.vendor?.business_name} · Order #{o.id} · ৳ {o.amount}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLE[o.status] || ""}`}>
                    {o.status}
                  </span>
                  {o.status === "pending" && (
                    <div className="mt-1">
                      <Link href={`/checkout/${o.id}`} className="text-xs text-indigo-600">Pay now →</Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<p className="text-gray-400">Loading…</p>}>
      <OrdersList />
    </Suspense>
  );
}
