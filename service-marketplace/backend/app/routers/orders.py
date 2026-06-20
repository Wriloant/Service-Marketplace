"""
Booking + checkout (End-User / customer).

  POST /orders            -> book a service (creates a pending order)
  POST /orders/{id}/pay   -> run the sandbox payment, persist a Transaction,
                             flip the order to paid (or leave pending on decline)
  GET  /orders            -> the caller's own order history
  GET  /orders/{id}       -> a single order the caller owns
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import payments
from ..database import get_db
from ..models import (Order, OrderStatus, PaymentStatus, Role, Service,
                      Transaction, User)
from ..schemas import OrderIn, OrderOut, PayIn
from ..security import require_role

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderOut, status_code=201)
def create_order(data: OrderIn, db: Session = Depends(get_db),
                 user: User = Depends(require_role(Role.customer))):
    svc = db.get(Service, data.service_id)
    if not svc or not svc.is_active:
        raise HTTPException(404, "Service not available")
    order = Order(customer_id=user.id, service_id=svc.id, vendor_id=svc.vendor_id,
                  amount=svc.price, address=data.address,
                  scheduled_at=data.scheduled_at, status=OrderStatus.pending)
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.post("/{order_id}/pay", response_model=OrderOut)
def pay_order(order_id: int, data: PayIn, db: Session = Depends(get_db),
              user: User = Depends(require_role(Role.customer))):
    order = db.get(Order, order_id)
    if not order or order.customer_id != user.id:
        raise HTTPException(404, "Order not found")
    if order.status == OrderStatus.paid:
        raise HTTPException(409, "Order already paid")

    # Call the sandbox gateway.
    resp = payments.charge(order.amount, data.card_token)
    success = resp["status"] == "success"

    txn = order.transaction or Transaction(order_id=order.id)
    txn.gateway = resp["gateway"]
    txn.gateway_ref = resp["gateway_ref"]
    txn.amount = resp["amount"]
    txn.status = PaymentStatus.success if success else PaymentStatus.failed
    txn.raw_payload = resp
    db.add(txn)

    if success:
        order.status = OrderStatus.paid
    db.commit()
    db.refresh(order)

    if not success:
        raise HTTPException(402, {"detail": "Payment declined", "gateway": resp})
    return order


@router.get("", response_model=list[OrderOut])
def my_orders(db: Session = Depends(get_db),
              user: User = Depends(require_role(Role.customer))):
    return (db.query(Order).filter(Order.customer_id == user.id)
            .order_by(Order.created_at.desc()).all())


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db),
              user: User = Depends(require_role(Role.customer))):
    order = db.get(Order, order_id)
    if not order or order.customer_id != user.id:
        raise HTTPException(404, "Order not found")
    return order
