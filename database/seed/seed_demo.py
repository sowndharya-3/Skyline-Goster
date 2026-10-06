"""Seeds the demo admin user and the storefront catalogue from src/catalog.ts.

Usage: python scripts/seed_demo.py   (run from backend/, with DATABASE_URL set)

Safe to re-run: product rows are upserted, but an existing admin user's password is
never touched by a re-run — only set when the admin row is first created. Set
SEED_ADMIN_PASSWORD to seed with your own password instead of the public demo one.
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.session import engine
from app.models import Product, User

ADMIN_EMAIL = os.environ.get('SEED_ADMIN_EMAIL', 'admin@ghosterstudio.com')
# Falls back to the same password already published in the UI and DEPLOYMENT.md as the
# public demo login — not a real secret. Override with SEED_ADMIN_PASSWORD for a
# non-demo deployment.
ADMIN_PASSWORD = os.environ.get('SEED_ADMIN_PASSWORD', 'ghoster123')

# Mirrors src/catalog.ts field-for-field so the API and the storefront agree on what exists.
FULL_SIZES = ['S', 'M', 'L', 'XL', 'XXL']
CATALOG = [
    dict(slug='shadow-oversized', sku='GH-SHADOW-OS', product_name='Shadow', price=1499, mrp=1499, image_url='product-shadow', color='Black', fit='Oversized', sleeve='Half sleeve', graphic=False, is_new_drop=True, sizes=FULL_SIZES, stock_quantity=40, classification='Stealth', worlds=['army', 'gamer', 'biker'], gallery=['product-shadow', 'product-shadow-back', 'campaign-hero'], description='Minimal on the front. Maximum in attitude. The Shadow tee is built for those who move in silence but still make an impact.'),
    dict(slug='eclipse', sku='GH-ECLIPSE', product_name='Eclipse', price=1499, mrp=1499, image_url='product-eclipse', color='Black', fit='Oversized', sleeve='Half sleeve', graphic=True, is_new_drop=True, sizes=FULL_SIZES, stock_quantity=35, classification='Night', worlds=['gamer', 'biker'], gallery=None, description='Dark on dark. A tonal emblem that reveals itself in the light. For the ones who find their focus after hours.'),
    dict(slug='tactical', sku='GH-TACTICAL', product_name='Tactical', price=1499, mrp=1499, image_url='product-tactical', color='Black', fit='Oversized', sleeve='Half sleeve', graphic=False, is_new_drop=True, sizes=FULL_SIZES, stock_quantity=30, classification='Field', worlds=['army'], gallery=None, description='Quiet confidence, considered details. A clean everyday uniform with a field-inspired identity.'),
    dict(slug='apex', sku='GH-APEX', product_name='Apex', price=1499, mrp=1499, image_url='product-apex', color='Black', fit='Oversized', sleeve='Half sleeve', graphic=True, is_new_drop=True, sizes=['S', 'M', 'L', 'XL'], stock_quantity=25, classification='Elite', worlds=['gamer'], gallery=None, description='Precision in every line. A vertical graphic and a relaxed silhouette for a mindset that never settles.'),
    dict(slug='strike', sku='GH-STRIKE', product_name='Strike', price=1499, mrp=1499, image_url='product-strike', color='Black', fit='Oversized', sleeve='Half sleeve', graphic=True, is_new_drop=True, sizes=FULL_SIZES, stock_quantity=30, classification='Impact', worlds=['army', 'biker'], gallery=None, description='An unmistakable emblem. An unspoken statement. Carry the GHOSTER identity wherever the road leads.'),
    dict(slug='off-duty-white', sku='GH-OFFDUTY-WHT', product_name='Off Duty Oversized Tee', price=899, mrp=1199, image_url='white-oversized', color='White', fit='Oversized', sleeve='Half sleeve', graphic=False, is_new_drop=False, sizes=FULL_SIZES, stock_quantity=60, classification=None, worlds=None, gallery=None, description='Easy volume, a clean neckline and a soft hand feel. Made for days that go your way.'),
    dict(slug='unseen-graphic', sku='GH-UNSEEN-GFX', product_name='Unseen Graphic Tee', price=999, mrp=1299, image_url='white-art-oversized', color='White', fit='Oversized', sleeve='Half sleeve', graphic=True, is_new_drop=False, sizes=['S', 'M', 'L', 'XL'], stock_quantity=45, classification=None, worlds=None, gallery=None, description='An expressive monochrome graphic on a roomy silhouette. Give your everyday rotation a different perspective.'),
    dict(slug='contrast-raglan', sku='GH-CONTRAST-RGL', product_name='Contrast Raglan Tee', price=1099, mrp=1399, image_url='raglan-longsleeve', color='White', fit='Regular', sleeve='Full sleeve', graphic=False, is_new_drop=False, sizes=FULL_SIZES, stock_quantity=40, classification=None, worlds=None, gallery=None, description='Black sleeves meet a clean white body. A full-sleeve essential with a vintage athletic feel.'),
    dict(slug='afterhours-black', sku='GH-AFTERHOURS-BLK', product_name='Afterhours Full Sleeve Tee', price=999, mrp=1299, image_url='black-longsleeve', color='Black', fit='Regular', sleeve='Full sleeve', graphic=False, is_new_drop=False, sizes=['S', 'M', 'L', 'XL'], stock_quantity=40, classification=None, worlds=None, gallery=None, description='Clean lines. Full coverage. A versatile black crew neck that works on its own or as a layer.'),
    dict(slug='essential-white', sku='GH-ESSENTIAL-WHT', product_name='Essential White Tee', price=699, mrp=899, image_url='hero-white', color='White', fit='Regular', sleeve='Half sleeve', graphic=False, is_new_drop=False, sizes=FULL_SIZES, stock_quantity=80, classification=None, worlds=None, gallery=None, description='The foundation of a good rotation. A classic white crew neck with a comfortable regular fit.'),
    dict(slug='concrete-black', sku='GH-CONCRETE-BLK', product_name='Concrete Everyday Tee', price=799, mrp=999, image_url='hero-concrete', color='Black', fit='Regular', sleeve='Half sleeve', graphic=False, is_new_drop=False, sizes=FULL_SIZES, stock_quantity=70, classification=None, worlds=None, gallery=None, description='An understated everyday staple. A straight silhouette that keeps things simple.'),
    dict(slug='street-white', sku='GH-STREET-WHT', product_name='Street Oversized Tee', price=949, mrp=1199, image_url='white-graphic', color='White', fit='Oversized', sleeve='Half sleeve', graphic=True, is_new_drop=False, sizes=FULL_SIZES, stock_quantity=50, classification=None, worlds=None, gallery=None, description='A loose streetwear silhouette with a subtle graphic detail. Easy to wear, hard to overlook.'),
]


def main():
    with Session(engine) as db:
        for row in CATALOG:
            existing = db.query(Product).filter_by(slug=row['slug']).one_or_none()
            if existing:
                for key, value in row.items():
                    setattr(existing, key, value)
            else:
                db.add(Product(**row))

        admin = db.query(User).filter_by(email=ADMIN_EMAIL).one_or_none()
        if admin:
            # Never overwrite an existing admin's password on a re-run — a production
            # redeploy must not silently reset a password someone already changed.
            print(f'Admin user {ADMIN_EMAIL} already exists; password left unchanged.')
        else:
            db.add(User(name='Studio Admin', email=ADMIN_EMAIL, password_hash=hash_password(ADMIN_PASSWORD), role='admin'))
            print(f'Created admin user {ADMIN_EMAIL}.')

        db.commit()
        print(f'Seeded {len(CATALOG)} products.')


if __name__ == '__main__':
    main()
