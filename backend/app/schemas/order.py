from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class OrderItemRequest(BaseModel):
    product_slug: str
    size: str
    quantity: int = Field(gt=0, le=10)


class CustomerRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(pattern=r'^[6-9][0-9]{9}$')
    email: EmailStr
    street: str = Field(min_length=3, max_length=255)
    city: str = Field(min_length=2, max_length=120)
    state: str = Field(min_length=2, max_length=120)
    pin: str = Field(pattern=r'^[1-9][0-9]{5}$')


class OrderCreateRequest(BaseModel):
    customer: CustomerRequest
    items: list[OrderItemRequest] = Field(min_length=1)
    payment_method: str = Field(pattern=r'^(UPI|Cards|Net banking|Cash on delivery)$')
    coupon: str | None = None


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    product_id: int
    product_slug: str
    product_name_snapshot: str
    size: str
    quantity: int
    unit_price: Decimal
    total_price: Decimal


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    public_order_number: str
    ship_name: str
    ship_phone: str
    ship_email: str
    ship_street: str
    ship_city: str
    ship_state: str
    ship_pincode: str
    subtotal: Decimal
    discount: Decimal
    shipping_fee: Decimal
    tax: Decimal
    total_amount: Decimal
    payment_method: str
    payment_status: str
    order_status: str
    created_at: datetime
    items: list[OrderItemResponse]


class OrderStatusUpdateRequest(BaseModel):
    order_status: str = Field(pattern=r'^(Confirmed|Processing|Shipped|Delivered|Cancelled)$')


class OrderSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    public_order_number: str
    ship_name: str
    ship_email: str
    total_amount: Decimal
    payment_method: str
    payment_status: str
    order_status: str
    item_count: int
    created_at: datetime


class PaginatedOrders(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[OrderSummaryResponse]
