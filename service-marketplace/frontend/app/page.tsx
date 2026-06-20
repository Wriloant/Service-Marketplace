"use client";

import { useEffect, useState } from "react";
import { Api } from "@/lib/api";
import ServiceCard from "@/components/ServiceCard";

export default function Marketplace() {
  const [services, setServices] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [active, setActive] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(query = "", category = "") {
    setLoading(true);
    try {
      setServices(await Api.services(query, category));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    Api.categories().then(setCats).catch(() => {});
    load();
  }, []);

  function pickCategory(slug: string) {
    const next = active === slug ? "" : slug;
    setActive(next);
    load(q, next);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Find a service</h1>
        <p className="text-gray-500">Browse offerings from verified vendors.</p>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(q, active)}
          placeholder="Search e.g. cleaning, AC..."
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 bg-white"
        />
        <button onClick={() => load(q, active)} className="bg-indigo-600 text-white px-4 rounded-md">
          Search
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {cats.map((c) => (
          <button
            key={c.id}
            onClick={() => pickCategory(c.slug)}
            className={`px-3 py-1 rounded-full text-sm border ${
              active === c.slug
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-300"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : services.length === 0 ? (
        <p className="text-gray-400">No services found.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {services.map((s) => <ServiceCard key={s.id} s={s} />)}
        </div>
      )}
    </div>
  );
}
