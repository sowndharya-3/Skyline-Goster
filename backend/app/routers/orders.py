from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Order
from app.schemas.order import OrderCreateRequest, OrderResponse
from app.services.order_service import create_order

router = APIRouter(prefix='/api/orders', tags=['orders'])


@router.post('', response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def place_order(payload: OrderCreateRequest, db: Session = Depends(get_db)):
    return create_order(db, payload)


@router.get('/{order_number}', response_model=OrderResponse)
def get_order(order_number: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.public_order_number == order_number).one_or_none()
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, 'Order not found.')
    return order
