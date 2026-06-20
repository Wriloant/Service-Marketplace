"""Pydantic v2 request/response schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from .models import OrderStatus, PaymentStatus, Role


# ---- auth ----------------------------------------------------------------
class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    role: Role = Role.customer                  # customer or vendor (admin is seeded)
    business_name: Optional[str] = None         # required when role == vendor


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: EmailStr
    role: Role
    created_at: datetime


# ---- categories ----------------------------------------------------------
class CategoryIn(BaseModel):
    name: str
    description: str = ""


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    slug: str
    description: str


# ---- services ------------------------------------------------------------
class ServiceIn(BaseModel):
    title: str
    description: str = ""
    price: float = Field(gt=0)
    duration_minutes: int = 60
    category_id: int


class ServiceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0)
    duration_minutes: Optional[int] = None
    category_id: Optional[int] = None
    is_active: Optional[bool] = None


class VendorMini(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    business_name: str


class ServiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str
    price: float
    duration_minutes: int
    is_active: bool
    category: CategoryOut
    vendor: VendorMini
    created_at: datetime


# ---- orders / checkout ---------------------------------------------------
class OrderIn(BaseModel):
    service_id: int
    address: str = ""
    scheduled_at: Optional[datetime] = None


class PayIn(BaseModel):
    card_token: str = "tok_success"


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    gateway: str
    gateway_ref: str
    status: PaymentStatus
    amount: float


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: OrderStatus
    amount: float
    address: str
    scheduled_at: Optional[datetime]
    created_at: datetime
    service: ServiceOut
    transaction: Optional[TransactionOut] = None


# ---- vendor profile ------------------------------------------------------
class VendorProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    business_name: str
    bio: str
    phone: str
    is_approved: bool


class VendorProfileUpdate(BaseModel):
    business_name: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
