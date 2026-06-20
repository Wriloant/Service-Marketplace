"use client";

import { useEffect, useState } from "react";
import { Api } from "@/lib/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    Api.adminStats().then(setStats).catch(() => {});
    Api.adminUsers().then(setUsers).catch(() => {});
    Api.adminOrders().then(setOrders).catch(() => {});
  }, []);

  const cards = stats ? [
    { label: "Users", value: stats.users },
    { label: "Vendors", value: stats.vendors },
    { label: "Services", value: stats.services },
    { label: "Orders", value: stats.orders },
    { label: "Revenue", value: `৳ ${stats.revenue}` },
  ] : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-xl font-bold text-gray-900">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold mb-2">Users</h2>
          <div className="bg-white rounded-lg border border-gray-200 divide-y">
            {users.map((u) => (
              <div key={u.id} className="px-4 py-2 flex justify-between text-sm">
                <span>{u.name} <span className="text-gray-400">{u.email}</span></span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full h-fit">{u.role}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-semibold mb-2">All orders</h2>
          <div className="bg-white rounded-lg border border-gray-200 divide-y">
            {orders.map((o) => (
              <div key={o.id} className="px-4 py-2 flex justify-between text-sm">
                <span>#{o.id} {o.service?.title}</span>
                <span className="text-gray-500">৳ {o.amount} · {o.status}</span>
              </div>
            ))}
            {orders.length === 0 && <p className="px-4 py-2 text-gray-400 text-sm">No orders.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
