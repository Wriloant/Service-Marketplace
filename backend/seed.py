"""
Seed the database with demo data: an admin, categories, two vendors with
services, and one customer. Idempotent-ish: it wipes and recreates.

Run:  python seed.py
Logins printed at the end.
"""
import re

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models import (Category, Role, Service, User, VendorProfile)
from app.security import hash_password


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def run():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # admin
    admin = User(name="Platform Admin", email=settings.admin_email,
                 password_hash=hash_password(settings.admin_password), role=Role.admin)
    db.add(admin)

    # categories
    cats = {}
    for name, desc in [("Cleaning", "Home & office cleaning"),
                       ("AC Repair", "Air-conditioner servicing"),
                       ("Electrician", "Wiring and electrical fixes"),
                       ("Beauty", "Salon & grooming at home")]:
        c = Category(name=name, slug=slug(name), description=desc)
        cats[name] = c
        db.add(c)
    db.flush()

    # vendors + their services
    vendor_defs = [
        ("Spotless Co.", "clean@market.com", [
            ("Deep Home Cleaning", "Cleaning", 2500, 180),
            ("Office Cleaning", "Cleaning", 4000, 240)]),
        ("CoolFix BD", "cool@market.com", [
            ("AC Servicing", "AC Repair", 1200, 90),
            ("AC Gas Refill", "AC Repair", 3000, 120),
            ("Emergency Electric Fix", "Electrician", 800, 60)]),
    ]
    for biz, email, svcs in vendor_defs:
        u = User(name=biz, email=email,
                 password_hash=hash_password("vendor1234"), role=Role.vendor)
        db.add(u); db.flush()
        vp = VendorProfile(user_id=u.id, business_name=biz, is_approved=True,
                           phone="017xxxxxxxx", bio=f"Trusted {biz} services.")
        db.add(vp); db.flush()
        for title, cat, price, dur in svcs:
            db.add(Service(vendor_id=vp.id, category_id=cats[cat].id, title=title,
                           description=f"{title} by {biz}.", price=price,
                           duration_minutes=dur))

    # customer
    db.add(User(name="Test Customer", email="customer@market.com",
                password_hash=hash_password("customer1234"), role=Role.customer))

    db.commit()
    db.close()

    print("Seed complete.\n")
    print("Logins (password):")
    print(f"  admin    : {settings.admin_email} / {settings.admin_password}")
    print( "  vendor   : clean@market.com / vendor1234")
    print( "  vendor   : cool@market.com  / vendor1234")
    print( "  customer : customer@market.com / customer1234")


if __name__ == "__main__":
    run()
