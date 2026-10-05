from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

ORDER_STATUSES = ('Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled')
PAYMENT_STATUSES = ('Pending', 'Paid', 'Failed', 'Refunded')
PAYMENT_METHODS = ('UPI', 'Cards', 'Net banking', 'Cash on delivery')


class Order(Base):
    __tablename__ = 'orders'
    __table_args__ = (UniqueConstraint('public_order_number', name='uq_orders_public_order_number'),)

    id: Mapped[int] = mapped_column(primary_key=True)
    # Customer-facing order id, e.g. 'GH-MTVJEBX4'. Never expose `id` to the frontend.
    public_order_number: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    customer_id: Mapped[int] = mapped_column(ForeignKey('customers.id', ondelete='RESTRICT'), nullable=False)

    # Shipping-address snapshot at the time of the order (independent of the customer's saved address).
    ship_name: Mapped[str] = mapped_column(String(120), nullable=False)
    ship_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    ship_email: Mapped[str] = mapped_column(String(254), nullable=False)
    ship_street: Mapped[str] = mapped_column(String(255), nullable=False)
    ship_city: Mapped[str] = mapped_column(String(120), nullable=False)
    ship_state: Mapped[str] = mapped_column(String(120), nullable=False)
    ship_pincode: Mapped[str] = mapped_column(String(10), nullable=False)

    subtotal: Mapped[int] = mapped_column(Numeric(10, 2), nullable=False)
    discount: Mapped[int] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    shipping_fee: Mapped[int] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    tax: Mapped[int] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    total_amount: Mapped[int] = mapped_column(Numeric(10, 2), nullable=False)

    payment_method: Mapped[str] = mapped_column(String(20), nullable=False)
    payment_status: Mapped[str] = mapped_column(String(20), nullable=False, default='Pending')
    order_status: Mapped[str] = mapped_column(String(20), nullable=False, default='Confirmed')

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    customer: Mapped['Customer'] = relationship(back_populates='orders')
    items: Mapped[list['OrderItem']] = relationship(back_populates='order', cascade='all, delete-orphan')


class OrderItem(Base):
    __tablename__ = 'order_items'

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey('orders.id', ondelete='CASCADE'), nullable=False, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey('products.id', ondelete='RESTRICT'), nullable=False)
    # Snapshot of the product name at purchase time, so later renames don't rewrite order history.
    product_name_snapshot: Mapped[str] = mapped_column(String(150), nullable=False)
    size: Mapped[str] = mapped_column(String(10), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[int] = mapped_column(Numeric(10, 2), nullable=False)
    total_price: Mapped[int] = mapped_column(Numeric(10, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    order: Mapped['Order'] = relationship(back_populates='items')
    product: Mapped['Product'] = relationship()

    @property
    def product_slug(self) -> str:
        return self.product.slug
