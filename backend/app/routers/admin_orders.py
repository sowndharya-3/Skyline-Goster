from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.db.session import get_db
from app.models import Order
from app.schemas.order import OrderResponse, OrderStatusUpdateRequest, OrderSummaryResponse, PaginatedOrders

router = APIRouter(prefix='/api/admin/orders', tags=['admin-orders'], dependencies=[Depends(require_admin)])


@router.get('', response_model=PaginatedOrders)
def list_orders(
    db: Session = Depends(get_db),
    status_filter: str | None = Query(default=None, alias='status'),
    search: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    query = db.query(Order)
    if status_filter:
        query = query.filter(Order.order_status == status_filter)
    if search:
        like = f'%{search}%'
        query = query.filter(or_(Order.public_order_number.ilike(like), Order.ship_name.ilike(like), Order.ship_email.ilike(like)))
    total = query.count()
    orders = query.order_by(Order.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    items = [
        OrderSummaryResponse(
            public_order_number=o.public_order_number, ship_name=o.ship_name, ship_email=o.ship_email,
            total_amount=o.total_amount, payment_method=o.payment_method, payment_status=o.payment_status,
            order_status=o.order_status, item_count=sum(line.quantity for line in o.items), created_at=o.created_at,
        )
        for o in orders
    ]
    return PaginatedOrders(total=total, page=page, page_size=page_size, items=items)


@router.get('/{order_number}', response_model=OrderResponse)
def get_order(order_number: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.public_order_number == order_number).one_or_none()
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, 'Order not found.')
    return order


@router.patch('/{order_number}/status', response_model=OrderResponse)
def update_status(order_number: str, payload: OrderStatusUpdateRequest, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.public_order_number == order_number).one_or_none()
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, 'Order not found.')
    order.order_status = payload.order_status
    db.commit()
    db.refresh(order)
    return order
