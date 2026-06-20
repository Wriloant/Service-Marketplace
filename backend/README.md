# Backend — ServiceHub API (FastAPI)

FastAPI + SQLAlchemy 2.0 + JWT. See the [top-level README](../README.md) for the full
picture and the [ERD](../docs/ERD.md).

## Run
```bash
pip install -r requirements.txt
python seed.py                       # demo data + printed logins
uvicorn app.main:app --reload        # http://localhost:8000  (Swagger at /docs)
python -m tests.test_api             # full end-to-end test (RBAC + payments)
```

## Layout
```
app/
  main.py        app wiring + CORS
  config.py      settings (env)
  database.py    engine/session/Base
  models.py      ORM = the schema (6 tables)
  schemas.py     Pydantic v2 request/response
  security.py    hashing, JWT, get_current_user, require_role  (RBAC)
  payments.py    mock sandbox gateway
  routers/       auth · categories · services · orders · vendor · admin
seed.py          demo data
tests/test_api.py end-to-end
```

## Auth quick reference
- `POST /auth/register` (customer or vendor), `POST /auth/login` → JWT bearer token.
- Send `Authorization: Bearer <token>` on protected routes.
- `require_role(...)` returns 403 on wrong role, 401 on missing/invalid token.
