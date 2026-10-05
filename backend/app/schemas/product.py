from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    sku: str
    product_name: str
    description: str
    price: Decimal
    mrp: Decimal
    image_url: str
    color: str
    fit: str
    sleeve: str
    is_new_drop: bool
    graphic: bool
    classification: str | None
    worlds: list[str] | None
    gallery: list[str] | None
    sizes: list[str]
    stock_quantity: int
    is_active: bool
