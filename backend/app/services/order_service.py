from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Customer, Order, OrderItem, Product
from app.schemas.order import OrderCreateRequest
from app.utils.order_number import generate_order_number

FREE_SHIPPING_THRESHOLD = Decimal('1499')
SHIPPING_FEE = Decimal('79')
COUPON_DISCOUNT_RATE = Decimal('0.1')
VALID_COUPON = 'GHOST10'
MAX_ORDER_NUMBER_ATTEMPTS = 5


def create_order(db: Session, payload: OrderCreateRequest) -> Order:
    # 1-2. Validate products exist, are active, and requested sizes are offered.
    products_by_slug: dict[str, Product] = {}
    for line in payload.items:
        product = db.query(Product).filter(Product.slug == line.product_slug, Product.is_active.is_(True)).one_or_none()
        if not product:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f'Product "{line.product_slug}" is not available.')
        if line.size not in product.sizes:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f'Size "{line.size}" is not offered for {product.product_name}.')
        products_by_slug[line.product_slug] = product

    # 3-4. Validate quantities and stock. Prices always come from the database, never the request body.
    for line in payload.items:
        product = products_by_slug[line.product_slug]
        if product.stock_quantity < line.quantity:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f'Only {product.stock_quantity} left of {product.product_name}.')

    # 5-9. Calculate totals server-side.
    subtotal = sum((products_by_slug[line.product_slug].price * line.quantity for line in payload.items), Decimal('0'))
    discount = (subtotal * COUPON_DISCOUNT_RATE).quantize(Decimal('1')) if payload.coupon == VALID_COUPON else Decimal('0')
    shipping_fee = Decimal('0') if subtotal == 0 or subtotal >= FREE_SHIPPING_THRESHOLD else SHIPPING_FEE
    tax = Decimal('0')
    total_amount = subtotal - discount + shipping_fee + tax

    try:
        # Upsert the customer by email, matching how the storefront ties repeat orders to one shopper.
        customer = db.query(Customer).filter(Customer.email == payload.customer.email).one_or_none()
        if customer:
            customer.name, customer.phone = payload.customer.name, payload.customer.phone
            customer.address, customer.city = payload.customer.street, payload.customer.city
            customer.state, customer.pincode = payload.customer.state, payload.customer.pin
        else:
            customer = Customer(
                name=payload.customer.name, email=payload.customer.email, phone=payload.customer.phone,
                address=payload.customer.street, city=payload.customer.city, state=payload.customer.state, pincode=payload.customer.pin,
            )
            db.add(customer)
        db.flush()

        # 10. Generate a unique public order number (checked against the DB; the id space is 36**8, so a
        # collision is vanishingly rare, but we still verify rather than assume).
        order_number = None
        for _ in range(MAX_ORDER_NUMBER_ATTEMPTS):
            candidate = generate_order_number()
            if not db.query(Order.id).filter(Order.public_order_number == candidate).first():
                order_number = candidate
                break
        if order_number is None:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, 'Could not allocate a unique order number.')

        # 11-13. Create the order, its line items, and decrement stock — all inside one transaction.
        order = Order(
            public_order_number=order_number, customer_id=customer.id,
            ship_name=payload.customer.name, ship_phone=payload.customer.phone, ship_email=payload.customer.email,
            ship_street=payload.customer.street, ship_city=payload.customer.city, ship_state=payload.customer.state, ship_pincode=payload.customer.pin,
            subtotal=subtotal, discount=discount, shipping_fee=shipping_fee, tax=tax, total_amount=total_amount,
            payment_method=payload.payment_method, payment_status='Paid' if payload.payment_method != 'Cash on delivery' else 'Pending',
            order_status='Confirmed',
        )
        db.add(order)
        db.flush()

        for line in payload.items:
            product = products_by_slug[line.product_slug]
            db.add(OrderItem(
                order_id=order.id, product_id=product.id, product_name_snapshot=product.product_name,
                size=line.size, quantity=line.quantity, unit_price=product.price, total_price=product.price * line.quantity,
            ))
            product.stock_quantity -= line.quantity

        # 14. Commit the whole transaction; any exception above rolls everything back instead.
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(order)
    return order
