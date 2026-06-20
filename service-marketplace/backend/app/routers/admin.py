"""Admin endpoints (role=admin only): oversight across all tenants."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Order, Role, Service, User, VendorProfile
from ..schemas import OrderOut, UserOut, VendorProfileOut
from ..security import require_role

router = APIRouter(prefix="/admin", tags=["admin"],
                   dependencies=[Depends(require_role(Role.admin))])


@router.get("/users", response_model=list[UserOut])
def all_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.get("/orders", response_model=list[OrderOut])
def all_orders(db: Session = Depends(get_db)):
    return db.query(Order).order_by(Order.created_at.desc()).all()


@router.get("/vendors", response_model=list[VendorProfileOut])
def all_vendors(db: Session = Depends(get_db)):
    return db.query(VendorProfile).all()


@router.patch("/vendors/{vendor_id}/approve", response_model=VendorProfileOut)
def approve_vendor(vendor_id: int, db: Session = Depends(get_db)):
    profile = db.get(VendorProfile, vendor_id)
    if not profile:
        raise HTTPException(404, "Vendor not found")
    profile.is_approved = True
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/stats")
def stats(db: Session = Depends(get_db)):
    return {
        "users": db.query(User).count(),
        "vendors": db.query(VendorProfile).count(),
        "services": db.query(Service).count(),
        "orders": db.query(Order).count(),
        "revenue": sum(o.amount for o in db.query(Order)
                       .filter(Order.status == "paid").all()),
    }
