"""
End-to-end API test exercising the whole system with FastAPI's TestClient.

Run:  python -m tests.test_api
Covers: registration, login, RBAC (admin/vendor/customer), catalog search,
booking, sandbox payment (success + decline), vendor jobs, admin oversight.
"""
import os
import tempfile

# Fresh throwaway DB BEFORE importing the app.
_db = os.path.join(tempfile.mkdtemp(), "test.db")
os.environ["DATABASE_URL"] = f"sqlite:///{_db}"
os.environ["JWT_SECRET"] = "test-secret"

from fastapi.testclient import TestClient            # noqa: E402

from app.main import app                              # noqa: E402
from app.database import SessionLocal                 # noqa: E402
from app.models import Role, User                     # noqa: E402
from app.security import hash_password                # noqa: E402

client = TestClient(app)


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def main():
    # --- seed an admin directly (admins are never self-registered) ---------
    db = SessionLocal()
    db.add(User(name="Admin", email="admin@demo.com",
                password_hash=hash_password("admin1234"), role=Role.admin))
    db.commit(); db.close()

    admin_tok = client.post("/auth/login", data={
        "username": "admin@demo.com", "password": "admin1234"}).json()["access_token"]

    # --- admin creates categories ------------------------------------------
    cat = client.post("/categories", json={"name": "Cleaning"},
                      headers=_auth(admin_tok))
    assert cat.status_code == 201, cat.text
    cat_id = cat.json()["id"]
    print("[ok] admin created category")

    # --- vendor registers + creates a service ------------------------------
    vtok = client.post("/auth/register", json={
        "name": "Spotless", "email": "v@demo.com", "password": "vendor1234",
        "role": "vendor", "business_name": "Spotless Co."}).json()["access_token"]
    svc = client.post("/services", json={
        "title": "Deep Cleaning", "price": 2500, "category_id": cat_id,
        "duration_minutes": 180}, headers=_auth(vtok))
    assert svc.status_code == 201, svc.text
    svc_id = svc.json()["id"]
    print("[ok] vendor created service")

    # --- RBAC: customer cannot create a service ----------------------------
    ctok = client.post("/auth/register", json={
        "name": "Cust", "email": "c@demo.com", "password": "customer1234",
        "role": "customer"}).json()["access_token"]
    denied = client.post("/services", json={
        "title": "X", "price": 1, "category_id": cat_id}, headers=_auth(ctok))
    assert denied.status_code == 403, denied.text
    print("[ok] RBAC: customer blocked from vendor endpoint (403)")

    # --- RBAC: vendor cannot hit an admin endpoint -------------------------
    assert client.get("/admin/users", headers=_auth(vtok)).status_code == 403
    # --- RBAC: unauthenticated cannot see orders ---------------------------
    assert client.get("/orders").status_code == 401
    print("[ok] RBAC: vendor blocked from admin (403); anon blocked (401)")

    # --- public catalog search (no auth) -----------------------------------
    found = client.get("/services", params={"q": "cleaning"}).json()
    assert any(s["id"] == svc_id for s in found)
    print("[ok] public search finds the service")

    # --- customer books + pays (success) -----------------------------------
    order = client.post("/orders", json={"service_id": svc_id, "address": "Dhaka"},
                        headers=_auth(ctok)).json()
    assert order["status"] == "pending"
    paid = client.post(f"/orders/{order['id']}/pay",
                       json={"card_token": "tok_success"}, headers=_auth(ctok))
    assert paid.status_code == 200, paid.text
    pj = paid.json()
    assert pj["status"] == "paid" and pj["transaction"]["status"] == "success"
    print(f"[ok] checkout success -> order paid, txn {pj['transaction']['gateway_ref']}")

    # --- customer books + payment declined ---------------------------------
    order2 = client.post("/orders", json={"service_id": svc_id},
                         headers=_auth(ctok)).json()
    declined = client.post(f"/orders/{order2['id']}/pay",
                          json={"card_token": "tok_fail"}, headers=_auth(ctok))
    assert declined.status_code == 402
    still = client.get(f"/orders/{order2['id']}", headers=_auth(ctok)).json()
    assert still["status"] == "pending"             # decline must NOT mark paid
    print("[ok] checkout decline -> 402, order stays pending")

    # --- vendor sees the received job --------------------------------------
    jobs = client.get("/vendor/orders", headers=_auth(vtok)).json()
    assert any(j["id"] == order["id"] for j in jobs)
    print("[ok] vendor sees received job")

    # --- admin oversight ---------------------------------------------------
    stats = client.get("/admin/stats", headers=_auth(admin_tok)).json()
    assert stats["revenue"] == 2500 and stats["orders"] == 2
    print(f"[ok] admin stats: {stats}")

    print("\nALL API CHECKS PASSED")


if __name__ == "__main__":
    main()
