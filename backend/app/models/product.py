from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Integer, JSON, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Product(Base):
    __tablename__ = 'products'

    id: Mapped[int] = mapped_column(primary_key=True)
    # Stable storefront identifier used in URLs and by the frontend catalogue (e.g. 'shadow-oversized').
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    sku: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    product_name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(String(2000), nullable=False, default='')
    price: Mapped[int] = mapped_column(Numeric(10, 2), nullable=False)
    mrp: Mapped[int] = mapped_column(Numeric(10, 2), nullable=False)
    image_url: Mapped[str] = mapped_column(String(255), nullable=False)
    color: Mapped[str] = mapped_column(String(30), nullable=False)
    fit: Mapped[str] = mapped_column(String(30), nullable=False)
    sleeve: Mapped[str] = mapped_column(String(30), nullable=False)
    is_new_drop: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    graphic: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    classification: Mapped[str | None] = mapped_column(String(40))
    worlds: Mapped[list[str] | None] = mapped_column(JSON)
    gallery: Mapped[list[str] | None] = mapped_column(JSON)
    sizes: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    stock_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )
