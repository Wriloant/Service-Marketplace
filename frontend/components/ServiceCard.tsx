"use client";

import Link from "next/link";

export default function ServiceCard({ s }: { s: any }) {
  return (
    <Link
      href={`/services/${s.id}`}
      className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900">{s.title}</h3>
        <span className="text-indigo-600 font-bold whitespace-nowrap">৳ {s.price}</span>
      </div>
      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{s.description}</p>
      <div className="flex items-center gap-2 mt-3 text-xs">
        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
          {s.category?.name}
        </span>
        <span className="text-gray-400">by {s.vendor?.business_name}</span>
        <span className="text-gray-400 ml-auto">{s.duration_minutes} min</span>
      </div>
    </Link>
  );
}
