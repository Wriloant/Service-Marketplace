# ServiceHub — Multi-Vendor Service Marketplace

**Assessment 4 — a secure, multi-tenant service marketplace** (inspired by Sheba.xyz),
built as a separate **FastAPI backend** and **Next.js + Tailwind frontend**.

Three roles (**Admin · Vendor · Customer**), a searchable categorised catalog, a full
booking → **sandbox checkout** journey, and role-scoped dashboards — with authorization
enforced at both the API layer (FastAPI dependencies) and the routing layer (Next.js
middleware).

```
service-marketplace/
├── backend/     FastAPI + SQLAlchemy 2.0 + JWT + SQLite      (the API + business logic)
├── frontend/    Next.js 16 (App Router) + TypeScript + Tailwind v4
└── docs/        ERD.md  ·  VIBE_CODING.md
```

> **Verified while building:** the backend's full test suite passes — every role flow,
> both RBAC denials (403/401), and both payment outcomes (approved + declined). The
> frontend compiles cleanly (`next build`, all 9 routes, TypeScript green).

---

## Quick start

### 1. Backend (terminal A)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python seed.py                 # creates marketplace.db with demo data + prints logins
uvicorn app.main:app --reload  # API at http://localhost:8000  (docs at /docs)
```

### 2. Frontend (terminal B)

```bash
cd frontend
npm install
cp .env.local.example .env.local      # points at http://localhost:8000
npm run dev                            # app at http://localhost:3000
```

### Demo logins (from `seed.py`)

| Role | Email | Password |
|---|---|---|
| Admin | admin@market.com | admin1234 |
| Vendor | clean@market.com | vendor1234 |
| Vendor | cool@market.com | vendor1234 |
| Customer | customer@market.com | customer1234 |

**Sandbox test cards at checkout:** `tok_success` → approved, `tok_fail` → declined.

---

## Features mapped to the brief

- **Auth & RBAC** — JWT login/registration; three roles; `require_role(...)` dependency
  guards every protected endpoint.
- **Profile ecosystem** — Customer: browse + order history (`/orders`). Vendor:
  dashboard to list services, **edit pricing inline**, and view **received jobs**
  (`/vendor`). Admin: platform stats, users, all orders (`/admin`).
- **Service discovery** — searchable catalog (`q` + category slug filter) over services
  from multiple vendors, grouped into categories.
- **Checkout & simulated processing** — book a service → checkout → **mock sandbox
  gateway** → a `Transaction` is persisted and the order flips to `paid` only on success.

---

## Must Explain

### A. Database schema / ERD
Full diagram and rationale in **[docs/ERD.md](docs/ERD.md)**. Six tables: `users`,
`vendor_profiles`, `categories`, `services`, `orders`, `transactions`. Key choices:
role lives on `users`; a 1-to-1 `vendor_profiles` separates person from business;
`transactions` is 1-to-1 with `orders` (unique `order_id`) and stores the raw gateway
payload; the order only becomes `paid` when its transaction succeeds.

### B. Vibe-coding workflow
Full account in **[docs/VIBE_CODING.md](docs/VIBE_CODING.md)** — schema-first, vertical
slices, test-driven RBAC, and a candid table of nine places the AI hallucinated
(SQLAlchemy 1.x vs 2.0, Pydantic v1 vs v2, the `localStorage`-vs-cookie middleware trap,
`useSearchParams` Suspense build failures, the `.test` TLD validation bug, missing CORS)
and how each was caught by actually running each slice.

### C. State management & route protection (two layers)
- **API layer (the real security boundary).** Every protected route declares its allowed
  roles via the `require_role(*roles)` dependency in `app/security.py`. The JWT carries
  `sub` (user id) and `role`; `get_current_user` decodes and loads the user, then
  `require_role` returns **403** for the wrong role, **401** for no/invalid token.
  Ownership is additionally checked inside handlers (a vendor can only edit *their own*
  services; a customer can only see *their own* orders).
- **Frontend state.** A React **`AuthContext`** (`lib/auth.tsx`) holds `token/role/name`,
  rehydrated from cookies on mount, and exposes `login/register/logout`. The token is
  stored in a **cookie** (not localStorage) specifically so it is readable on the server.
- **Frontend routing layer.** **`middleware.ts`** runs server-side before protected pages
  render, reading the `token`/`role` cookies to redirect anonymous users to `/login` and
  wrong-role users to `/`. This is defence-in-depth + UX; FastAPI remains the authority.

---

## Tech stack

| | |
|---|---|
| Backend | FastAPI, SQLAlchemy 2.0 (typed ORM), Pydantic v2, PyJWT, passlib (pbkdf2), SQLite (Postgres-ready) |
| Frontend | Next.js 16 App Router, TypeScript, Tailwind CSS v4, cookie-based auth, middleware route guards |
| Testing | `backend/tests/test_api.py` — full end-to-end via FastAPI TestClient |

Run the backend test: `cd backend && python -m tests.test_api`

---

## Demo video flow (suggested)

1. Show the API docs at `/docs` and run `python -m tests.test_api` (all green).
2. Register as a **vendor**, add a service with a price.
3. Log in as a **customer**, search the catalog, open the service, book it.
4. At **checkout**, pay with `tok_success` (approved) — show the order become `paid`;
   then book again and pay with `tok_fail` (declined) — show it stays `pending`.
5. Back in the **vendor** dashboard, show the received job; in **admin**, show the
   stats/revenue update. Try visiting `/admin` as the customer to show the redirect.
```
