"""
ORM models = the database schema.

Entity map (see docs/ERD.md for the diagram):
    User 1—1 VendorProfile (only for role=vendor)
    VendorProfile 1—* Service
    Category    1—* Service
    User(customer) 1—* Order
    Service     1—* Order
    Order       1—1 Transaction   (the sandbox payment record)
"""
from __future__ import annotations

import enum
from datetime import datetime, timezone

from sqlalchemy import (Boolean, DateTime, Enum, Float, ForeignKey, Integer,
                        String, Text, JSON)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Role(str, enum.Enum):
    admin = "admin"
    vendor = "vendor"
    customer = "customer"          # the "End-User"


class OrderStatus(str, enum.Enum):
    pending = "pending"            # created, not yet paid
    paid = "paid"                  # payment succeeded
    completed = "completed"        # service delivered
    cancelled = "cancelled"


class PaymentStatus(str, enum.Enum):
    initiated = "initiated"
    success = "success"
    failed = "failed"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(Enum(Role), default=Role.customer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    vendor_profile: Mapped["VendorProfile | None"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan")
    orders: Mapped[list["Order"]] = relationship(
        back_populates="customer", foreign_keys="Order.customer_id")


class VendorProfile(Base):
    __tablename__ = "vendor_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    business_name: Mapped[str] = mapped_column(String(160))
    bio: Mapped[str] = mapped_column(Text, default="")
    phone: Mapped[str] = mapped_column(String(40), default="")
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    user: Mapped["User"] = relationship(back_populates="vendor_profile")
    services: Mapped[list["Service"]] = relationship(
        back_populates="vendor", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, default="")

    services: Mapped[list["Service"]] = relationship(back_populates="category")


class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(primary_key=True)
    vendor_id: Mapped[int] = mapped_column(ForeignKey("vendor_profiles.id"), index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), index=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    price: Mapped[float] = mapped_column(Float)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    vendor: Mapped["VendorProfile"] = relationship(back_populates="services")
    category: Mapped["Category"] = relationship(back_populates="services")
    orders: Mapped[list["Order"]] = relationship(back_populates="service")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"), index=True)
    vendor_id: Mapped[int] = mapped_column(ForeignKey("vendor_profiles.id"), index=True)
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.pending)
    amount: Mapped[float] = mapped_column(Float)
    address: Mapped[str] = mapped_column(String(300), default="")
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    customer: Mapped["User"] = relationship(
        back_populates="orders", foreign_keys=[customer_id])
    service: Mapped["Service"] = relationship(back_populates="orders")
    transaction: Mapped["Transaction | None"] = relationship(
        back_populates="order", uselist=False, cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), unique=True)
    gateway: Mapped[str] = mapped_column(String(40), default="sandbox")
    gateway_ref: Mapped[str] = mapped_column(String(80))
    status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), default=PaymentStatus.initiated)
    amount: Mapped[float] = mapped_column(Float)
    raw_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    order: Mapped["Order"] = relationship(back_populates="transaction")
