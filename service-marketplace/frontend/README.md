# Frontend — ServiceHub (Next.js + Tailwind)

Next.js 16 (App Router) + TypeScript + Tailwind v4. See the
[top-level README](../README.md) for the full picture.

## Run
```bash
npm install
cp .env.local.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev                          # http://localhost:3000
```
The backend must be running first (see ../backend).

## Key files
```
app/
  layout.tsx                wraps AuthProvider + Navbar
  page.tsx                  marketplace (search + categories)
  login/ register/          auth
  services/[id]/            service detail + booking
  checkout/[orderId]/       sandbox payment
  orders/                   customer order history
  vendor/                   vendor dashboard (services, pricing, jobs)
  admin/                    admin dashboard (stats, users, orders)
lib/api.ts                  fetch client (reads token cookie)
lib/auth.tsx                AuthContext (state + cookie persistence)
middleware.ts               server-side route protection by role
```
