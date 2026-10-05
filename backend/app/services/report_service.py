from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Order, OrderItem


def _day_bounds(day: date) -> tuple[datetime, datetime]:
    start = datetime.combine(day, time.min, tzinfo=timezone.utc)
    return start, start + timedelta(days=1)


def build_report(db: Session, start_date: date, end_date: date):
    # ponytail: filters/aggregates orders in Python rather than pushing GROUP BY to Postgres.
    # Fine at prototype/demo order volumes; move to a SQL aggregate query if a period ever holds
    # more than a few thousand orders.
    range_start, _ = _day_bounds(start_date)
    _, range_end = _day_bounds(end_date)

    orders = db.query(Order).filter(Order.created_at >= range_start, Order.created_at < range_end).all()
    active_orders = [o for o in orders if o.order_status != 'Cancelled']

    total_sales = sum((o.total_amount for o in active_orders), Decimal('0'))
    completed_orders = sum(1 for o in orders if o.order_status == 'Delivered')
    cancelled_orders = sum(1 for o in orders if o.order_status == 'Cancelled')
    items_sold = 0
    if active_orders:
        order_ids = [o.id for o in active_orders]
        items_sold = db.query(func.coalesce(func.sum(OrderItem.quantity), 0)).filter(OrderItem.order_id.in_(order_ids)).scalar()
    average_order_value = (total_sales / len(active_orders)) if active_orders else Decimal('0')

    daily = []
    span_days = (end_date - start_date).days + 1
    if span_days <= 92:
        for offset in range(span_days):
            day = start_date + timedelta(days=offset)
            day_start, day_end = _day_bounds(day)
            day_orders = [o for o in orders if day_start <= o.created_at < day_end]
            day_active = [o for o in day_orders if o.order_status != 'Cancelled']
            day_items = 0
            if day_active:
                ids = [o.id for o in day_active]
                day_items = db.query(func.coalesce(func.sum(OrderItem.quantity), 0)).filter(OrderItem.order_id.in_(ids)).scalar()
            daily.append({
                'date': day, 'orders': len(day_orders), 'items_sold': day_items,
                'sales_amount': sum((o.total_amount for o in day_active), Decimal('0')),
            })

    return {
        'period': {'start_date': start_date, 'end_date': end_date},
        'summary': {
            'total_sales': total_sales, 'total_orders': len(orders), 'completed_orders': completed_orders,
            'cancelled_orders': cancelled_orders, 'items_sold': items_sold,
            'average_order_value': round(average_order_value, 2),
        },
        'daily_sales': daily,
    }
