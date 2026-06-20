"""Category endpoints. Listing is public; creation is admin-only."""
import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Category, Role, User
from ..schemas import CategoryIn, CategoryOut
from ..security import require_role

router = APIRouter(prefix="/categories", tags=["categories"])


def _slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


@router.get("", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.name).all()


@router.post("", response_model=CategoryOut, status_code=201)
def create_category(data: CategoryIn, db: Session = Depends(get_db),
                    _: User = Depends(require_role(Role.admin))):
    slug = _slugify(data.name)
    if db.query(Category).filter(Category.slug == slug).first():
        raise HTTPException(409, "Category already exists")
    cat = Category(name=data.name, slug=slug, description=data.description)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat
