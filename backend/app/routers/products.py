from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Product
from app.schemas.product import ProductResponse

router = APIRouter(prefix='/api/products', tags=['products'])


@router.get('', response_model=list[ProductResponse])
def list_products(db: Session = Depends(get_db)):
    return db.query(Product).filter(Product.is_active.is_(True)).order_by(Product.id).all()


@router.get('/{slug}', response_model=ProductResponse)
def get_product(slug: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.slug == slug, Product.is_active.is_(True)).one_or_none()
    if not product:
        raise HTTPException(status.HTTP_404_NOT_FOUND, 'Product not found.')
    return product
