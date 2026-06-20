"use client";

import { useEffect, useState } from "react";
import { Api } from "@/lib/api";

export default function VendorDashboard() {
  const [tab, setTab] = useState<"services" | "jobs">("services");
  const [services, setServices] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", price: "", duration_minutes: "60", category_id: "", description: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setServices(await Api.vendorServices().catch(() => []));
    setJobs(await Api.vendorOrders().catch(() => []));
  }
  useEffect(() => {
    Api.categories().then((c) => { setCats(c); setForm((f) => ({ ...f, category_id: String(c[0]?.id || "") })); });
    refresh();
  }, []);

  async function addService(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      await Api.createService({
        title: form.title, description: form.description,
        price: Number(form.price), duration_minutes: Number(form.duration_minutes),
        category_id: Number(form.category_id),
      });
      setForm((f) => ({ ...f, title: "", price: "", description: "" }));
      await refresh();
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  async function updatePrice(id: number, price: number) {
    await Api.updateService(id, { price });
    await refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Vendor dashboard</h1>
      <div className="flex gap-2 mb-5">
        {(["services", "jobs"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm capitalize ${tab === t ? "bg-indigo-600 text-white" : "bg-white border border-gray-300 text-gray-600"}`}>
            {t === "services" ? "My services" : "Received jobs"}
          </button>
        ))}
      </div>

      {tab === "services" ? (
        <div className="grid md:grid-cols-2 gap-6">
          <form onSubmit={addService} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 h-fit">
            <h2 className="font-semibold">Add a service</h2>
            <input className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Title"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <textarea className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Description"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="flex gap-2">
              <input className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Price" type="number"
                value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              <input className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Minutes" type="number"
                value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
            </div>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
              value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {err && <p className="text-red-600 text-sm">{err}</p>}
            <button disabled={busy} className="bg-indigo-600 text-white px-4 py-2 rounded-md disabled:opacity-60">
              {busy ? "…" : "Add service"}
            </button>
          </form>

          <div className="space-y-3">
            {services.length === 0 && <p className="text-gray-400">No services yet.</p>}
            {services.map((s) => (
              <div key={s.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex justify-between">
                  <p className="font-medium">{s.title}</p>
                  <span className="text-xs text-gray-400">{s.category?.name}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-gray-500">৳</span>
                  <input type="number" defaultValue={s.price}
                    onBlur={(e) => Number(e.target.value) !== s.price && updatePrice(s.id, Number(e.target.value))}
                    className="border border-gray-300 rounded-md px-2 py-1 w-28 text-sm" />
                  <span className="text-xs text-gray-400">(edit & blur to save)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.length === 0 && <p className="text-gray-400">No jobs received yet.</p>}
          {jobs.map((o) => (
            <div key={o.id} className="bg-white rounded-lg border border-gray-200 p-4 flex justify-between">
              <div>
                <p className="font-medium">{o.service?.title}</p>
                <p className="text-sm text-gray-500">Order #{o.id} · ৳ {o.amount} · {o.address || "no address"}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full h-fit ${o.status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                {o.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
