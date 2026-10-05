from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class ReportPeriod(BaseModel):
    start_date: date
    end_date: date


class ReportSummary(BaseModel):
    total_sales: Decimal
    total_orders: int
    completed_orders: int
    cancelled_orders: int
    items_sold: int
    average_order_value: Decimal


class DailySales(BaseModel):
    date: date
    orders: int
    items_sold: int
    sales_amount: Decimal


class ReportResponse(BaseModel):
    period: ReportPeriod
    summary: ReportSummary
    daily_sales: list[DailySales]
