"""
Service catalog endpoints.

Public:   GET /services       (search `q`, filter by `category`, paginate)
          GET /services/{id}
Vendor:   POST /services      (create under own profile)
          PATCH/DELETE /services/{id}  (must own it; admin may also delete)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Category, Role, Service, User, VendorProfile
from ..schemas import ServiceIn, ServiceOut, ServiceUpdate
from ..security import get_current_user, require_role

router = APIRouter(prefix="/services", tags=["services"])


def _vendor_profile(db: Session, user: User) -> VendorProfile:
    profile = db.query(VendorProfile).filter(VendorProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(400, "No vendor profile for this user")
    return profile


@router.get("", response_model=list[ServiceOut])
def list_services(
    q: str | None = Query(None, description="search in title/description"),
    category: str | None = Query(None, description="category slug"),
    skip: int = 0, limit: int = Query(20, le=100),
    db: Session = Depends(get_db),
):
    query = (db.query(Service)
             .options(joinedload(Service.category), joinedload(Service.vendor))
             .filter(Service.is_active.is_(True)))
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Service.title.ilike(like),
                                 Service.description.ilike(like)))
    if category:
        query = query.join(Category).filter(Category.slug == category)
    return query.order_by(Service.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{service_id}", response_model=ServiceOut)
def get_service(service_id: int, db: Session = Depends(get_db)):
    svc = db.get(Service, service_id)
    if not svc:
        raise HTTPException(404, "Service not found")
    return svc


@router.post("", response_model=ServiceOut, status_code=201)
def create_service(data: ServiceIn, db: Session = Depends(get_db),
                   user: User = Depends(require_role(Role.vendor))):
    if not db.get(Category, data.category_id):
        raise HTTPException(404, "Category not found")
    profile = _vendor_profile(db, user)
    svc = Service(vendor_id=profile.id, **data.model_dump())
    db.add(svc)
    db.commit()
    db.refresh(svc)
    return svc


@router.patch("/{service_id}", response_model=ServiceOut)
def update_service(service_id: int, data: ServiceUpdate, db: Session = Depends(get_db),
                   user: User = Depends(require_role(Role.vendor))):
    svc = db.get(Service, service_id)
    if not svc:
        raise HTTPException(404, "Service not found")
    if svc.vendor.user_id != user.id:                 # ownership check
        raise HTTPException(403, "You can only edit your own services")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(svc, field, value)
    db.commit()
    db.refresh(svc)
    return svc


@router.delete("/{service_id}", status_code=204)
def delete_service(service_id: int, db: Session = Depends(get_db),
                   user: User = Depends(get_current_user)):
    svc = db.get(Service, service_id)
    if not svc:
        raise HTTPException(404, "Service not found")
    is_owner = svc.vendor.user_id == user.id
    if not (is_owner or user.role == Role.admin):
        raise HTTPException(403, "Not allowed to delete this service")
    db.delete(svc)
    db.commit()
