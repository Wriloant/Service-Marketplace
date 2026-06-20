"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Navbar() {
  const { role, name, logout, ready } = useAuth();
  const router = useRouter();

  function onLogout() {
    logout();
    router.push("/");
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-indigo-600">
          ServiceHub
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-gray-600 hover:text-gray-900">Marketplace</Link>
          {ready && role === "customer" && (
            <Link href="/orders" className="text-gray-600 hover:text-gray-900">My Orders</Link>
          )}
          {ready && role === "vendor" && (
            <Link href="/vendor" className="text-gray-600 hover:text-gray-900">Vendor</Link>
          )}
          {ready && role === "admin" && (
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">Admin</Link>
          )}
          {ready && !role && (
            <>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">Login</Link>
              <Link href="/register" className="bg-indigo-600 text-white px-3 py-1.5 rounded-md">
                Sign up
              </Link>
            </>
          )}
          {ready && role && (
            <>
              <span className="text-gray-400 hidden sm:inline">
                {name} <span className="text-xs">({role})</span>
              </span>
              <button onClick={onLogout} className="text-gray-600 hover:text-red-600">
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
