# Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o| VENDOR_PROFILES : "has (role=vendor)"
    USERS ||--o{ ORDERS : "places (role=customer)"
    VENDOR_PROFILES ||--o{ SERVICES : offers
    CATEGORIES ||--o{ SERVICES : groups
    SERVICES ||--o{ ORDERS : "booked in"
    VENDOR_PROFILES ||--o{ ORDERS : fulfills
    ORDERS ||--|| TRANSACTIONS : "paid by"

    USERS {
        int id PK
        string name
        string email UK
        string password_hash
        enum role "admin|vendor|customer"
        datetime created_at
    }
    VENDOR_PROFILES {
        int id PK
        int user_id FK,UK
        string business_name
        string bio
        string phone
        bool is_approved
    }
    CATEGORIES {
        int id PK
        string name UK
        string slug UK
        string description
    }
    SERVICES {
        int id PK
        int vendor_id FK
        int category_id FK
        string title
        float price
        int duration_minutes
        bool is_active
        datetime created_at
    }
    ORDERS {
        int id PK
        int customer_id FK
        int service_id FK
        int vendor_id FK
        enum status "pending|paid|completed|cancelled"
        float amount
        string address
        datetime scheduled_at
        datetime created_at
    }
    TRANSACTIONS {
        int id PK
        int order_id FK,UK
        string gateway
        string gateway_ref
        enum status "initiated|success|failed"
        float amount
        json raw_payload
        datetime created_at
    }
```

## Why the model is shaped this way (multi-tenant safety)

- **`users` carries the role**, so authentication is one table and authorization is a
  single enum check. A `vendor` gets a **`vendor_profiles`** row (1-to-1); services and
  received jobs hang off that profile, never off the raw user — this cleanly separates
  "the person" from "the business".
- **`orders` denormalises `vendor_id`** (alongside `service_id`). It is derivable via
  the service, but storing it makes the vendor's "received jobs" query a direct,
  index-backed filter and keeps the job tied to the vendor even if the service is later
  edited.
- **`transactions` is 1-to-1 with `orders`** via a **unique** `order_id`. The sandbox
  gateway response is persisted verbatim in `raw_payload` (JSON) for auditability, and
  the order only flips to `paid` when the transaction status is `success` — a declined
  charge leaves the order `pending`, so payment state is never ambiguous.
- Every cross-tenant query is scoped by an owning id (`customer_id`, `vendor_id`), which
  is the data-layer half of the tenant isolation that RBAC enforces at the API layer.
```
