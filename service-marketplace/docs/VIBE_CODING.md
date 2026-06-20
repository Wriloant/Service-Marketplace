# Vibe-Coding Engineering Workflow

This documents how the project was built with heavy AI-tool assistance, and — more
usefully — **where the AI was right, where it was confidently wrong, and what needed a
human to catch.** The honest failures below are the point of this section.

## How the prompts were structured

I worked **schema-first, in vertical slices**, not "build me a marketplace." The
sequence that worked:

1. **Pin the data model before any code.** First prompt produced the ERD and the
   SQLAlchemy models. Everything downstream (schemas, routers, frontend types) was
   generated *against that fixed contract*, which stopped the AI from drifting field
   names between layers.
2. **One vertical slice at a time:** model → Pydantic schema → router → frontend page,
   for auth first, then catalog, then checkout. Each slice was tested before moving on.
3. **Constrain the stack explicitly in every prompt** ("SQLAlchemy 2.0 typed
   `Mapped`/`mapped_column`", "Pydantic v2", "Next.js App Router client component").
   Left unconstrained, the AI defaulted to older idioms (see failures).
4. **Make the AI write the test, then make the test pass.** The RBAC matrix was
   specified as assertions ("customer POST /services → 403") and the implementation was
   shaped to satisfy them.

## Where the AI tools succeeded

- **Boilerplate CRUD and Pydantic schemas** — fast and almost always correct.
- **Tailwind layouts** for the dashboards and forms — good first drafts, minor spacing
  tweaks only.
- **The mock gateway and the seed script** — essentially one-shot.
- **Repetitive symmetry** (the four routers share a shape) — great at pattern-filling
  once the first one existed.

## Where the AI failed or hallucinated (and the manual fix)

| # | What the AI produced | Why it was wrong | Manual fix |
|---|---|---|---|
| 1 | SQLAlchemy **1.x** `Column(Integer, primary_key=True)` | We pinned 2.0; mixing styles breaks typing | Rewrote as typed `Mapped[int] = mapped_column(...)` |
| 2 | Pydantic **v1** `class Config: orm_mode = True` | v2 renamed it | `model_config = ConfigDict(from_attributes=True)` |
| 3 | JWT `sub` set to an **int** user id | PyJWT/`sub` must be a string; decode then failed | Encode `str(user.id)`, cast back with `int()` on decode |
| 4 | `require_role` returned the **function**, not a dependency | FastAPI needs a callable dependency | Made it a **dependency factory** returning an inner `checker` |
| 5 | Frontend stored the token in **`localStorage`** | Next.js **middleware runs server-side** and cannot read localStorage, so route protection silently did nothing | Switched to **cookies** so middleware *and* the API client can both read the token |
| 6 | Next.js page used `useSearchParams()` with no boundary | Next 15/16 **fails the build** without a `<Suspense>` wrapper | Wrapped the orders/login pages in `<Suspense>` |
| 7 | Tailwind config as `tailwind.config.js` + `@tailwind base;` | This project is **Tailwind v4**, which uses `@import "tailwindcss"` and no config file | Deleted the config, used the v4 import |
| 8 | Demo emails like `user@market.test` | `email-validator` **rejects the reserved `.test` TLD**, so every registration 422-ed | Switched demo domains to `.com` (kept strict validation on) |
| 9 | Backend had **no CORS** for the Next dev server | Browser blocked every call from `localhost:3000` | Added `CORSMiddleware` with the dev origins |

**Takeaway:** the AI is excellent at *shape* (structure, boilerplate, symmetry) and
unreliable at *version-specific edges* (framework majors, validation quirks, the
client/server boundary). The human value-add was almost entirely at those seams — which
is exactly why every slice was run, not just read.
