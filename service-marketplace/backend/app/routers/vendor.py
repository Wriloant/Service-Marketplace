"""
Vendor dashboard endpoints (role=vendor only).

  GET   /vendor/profile        view own profile
  PATCH /vendor/profile        edit business name / bio / phone
  GET   /vendor/services       own service listings
  GET   /vendor/orders         jobs received across all own services
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Order, Role, Service, User, VendorProfile
from ..schemas import (OrderOut, ServiceOut, VendorProfileOut,
                       VendorProfileUpdate)
from ..security import require_role

router = APIRouter(prefix="/vendor", tags=["vendor"])


def _profile(db: Session, user: User) -> VendorProfile:
    profile = db.query(VendorProfile).filter(VendorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(404, "Vendor profile not found")
    return profile


@router.get("/profile", response_model=VendorProfileOut)
def get_profile(db: Session = Depends(get_db),
                user: User = Depends(require_role(Role.vendor))):
    return _profile(db, user)


@router.patch("/profile", response_model=VendorProfileOut)
def update_profile(data: VendorProfileUpdate, db: Session = Depends(get_db),
                   user: User = Depends(require_role(Role.vendor))):
    profile = _profile(db, user)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/services", response_model=list[ServiceOut])
def my_services(db: Session = Depends(get_db),
                user: User = Depends(require_role(Role.vendor))):
    profile = _profile(db, user)
    return (db.query(Service).filter(Service.vendor_id == profile.id)
            .order_by(Service.created_at.desc()).all())


@router.get("/orders", response_model=list[OrderOut])
def received_jobs(db: Session = Depends(get_db),
                  user: User = Depends(require_role(Role.vendor))):
    profile = _profile(db, user)
    return (db.query(Order).filter(Order.vendor_id == profile.id)
            .order_by(Order.created_at.desc()).all())
