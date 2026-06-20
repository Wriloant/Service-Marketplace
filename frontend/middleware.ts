// Route protection at the framework layer.
//
// This runs on the server before a protected page renders, reading the `token`
// and `role` cookies set at login. It complements the API-layer RBAC: even
// before any request reaches FastAPI, the wrong role is redirected away.
// (FastAPI's require_role remains the real security boundary; this is UX +
// defence-in-depth, since a token could be forged client-side.)

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLE_RULES: { prefix: string; roles: string[] }[] = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/vendor", roles: ["vendor"] },
  { prefix: "/orders", roles: ["customer"] },
  { prefix: "/checkout", roles: ["customer"] },
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const rule = ROLE_RULES.find((r) => pathname.startsWith(r.prefix));
  if (!rule) return NextResponse.next();

  const token = req.cookies.get("token")?.value;
  const role = req.cookies.get("role")?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (role && !rule.roles.includes(role)) {
    const url = req.nextUrl.clone();
    url.pathname = "/";                         // logged in but wrong role
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/vendor/:path*", "/orders/:path*", "/checkout/:path*"],
};
