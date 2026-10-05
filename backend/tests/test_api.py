"""Runs against the app object directly (no live server needed), but the same
DATABASE_URL as the running app — this is an integration smoke test, not a
unit test with mocks, because the thing worth protecting here is the real
order-creation transaction (pricing, stock, uniqueness), not isolated functions.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

ADMIN_EMAIL = 'admin@ghosterstudio.com'
ADMIN_PASSWORD = 'ghoster123'


@pytest.fixture
def admin_token():
    resp = client.post('/api/auth/login', json={'email': ADMIN_EMAIL, 'password': ADMIN_PASSWORD})
    assert resp.status_code == 200
    return resp.json()['access_token']


def test_login_rejects_wrong_password():
    resp = client.post('/api/auth/login', json={'email': ADMIN_EMAIL, 'password': 'wrong'})
    assert resp.status_code == 401


def test_login_succeeds_and_me_reflects_it(admin_token):
    resp = client.get('/api/auth/me', headers={'Authorization': f'Bearer {admin_token}'})
    assert resp.status_code == 200
    assert resp.json()['email'] == ADMIN_EMAIL


def test_me_requires_auth():
    assert client.get('/api/auth/me').status_code == 401


def test_products_list_is_nonempty():
    resp = client.get('/api/products')
    assert resp.status_code == 200
    assert len(resp.json()) > 0


def test_unknown_product_returns_404():
    assert client.get('/api/products/does-not-exist').status_code == 404


def test_order_rejects_unknown_product():
    resp = client.post('/api/orders', json={
        'customer': {'name': 'Test User', 'phone': '9876543210', 'email': 'apitest1@example.com', 'street': '1 Test Rd', 'city': 'Chennai', 'state': 'Tamil Nadu', 'pin': '600001'},
        'items': [{'product_slug': 'not-a-product', 'size': 'M', 'quantity': 1}],
        'payment_method': 'UPI',
    })
    assert resp.status_code == 400


def test_order_prices_from_database_not_request():
    product = client.get('/api/products/shadow-oversized').json()
    resp = client.post('/api/orders', json={
        'customer': {'name': 'Test User', 'phone': '9876543210', 'email': 'apitest2@example.com', 'street': '1 Test Rd', 'city': 'Chennai', 'state': 'Tamil Nadu', 'pin': '600001'},
        'items': [{'product_slug': 'shadow-oversized', 'size': 'M', 'quantity': 1}],
        'payment_method': 'UPI',
    })
    assert resp.status_code == 201
    body = resp.json()
    assert body['items'][0]['unit_price'] == product['price']
    assert body['public_order_number'].startswith('GH-')


def test_order_applies_coupon_discount():
    resp = client.post('/api/orders', json={
        'customer': {'name': 'Test User', 'phone': '9876543210', 'email': 'apitest3@example.com', 'street': '1 Test Rd', 'city': 'Chennai', 'state': 'Tamil Nadu', 'pin': '600001'},
        'items': [{'product_slug': 'shadow-oversized', 'size': 'M', 'quantity': 1}],
        'payment_method': 'UPI', 'coupon': 'GHOST10',
    })
    body = resp.json()
    assert float(body['discount']) == round(float(body['subtotal']) * 0.1)


def test_order_rejects_quantity_beyond_stock():
    resp = client.post('/api/orders', json={
        'customer': {'name': 'Test User', 'phone': '9876543210', 'email': 'apitest4@example.com', 'street': '1 Test Rd', 'city': 'Chennai', 'state': 'Tamil Nadu', 'pin': '600001'},
        'items': [{'product_slug': 'shadow-oversized', 'size': 'M', 'quantity': 999999}],
        'payment_method': 'UPI',
    })
    assert resp.status_code == 422 or resp.status_code == 400


def test_admin_orders_require_auth():
    assert client.get('/api/admin/orders').status_code == 401


def test_admin_can_list_and_update_order(admin_token):
    headers = {'Authorization': f'Bearer {admin_token}'}
    create = client.post('/api/orders', json={
        'customer': {'name': 'Test User', 'phone': '9876543210', 'email': 'apitest5@example.com', 'street': '1 Test Rd', 'city': 'Chennai', 'state': 'Tamil Nadu', 'pin': '600001'},
        'items': [{'product_slug': 'shadow-oversized', 'size': 'M', 'quantity': 1}],
        'payment_method': 'Cash on delivery',
    }).json()
    order_number = create['public_order_number']

    listing = client.get('/api/admin/orders', headers=headers)
    assert listing.status_code == 200
    assert listing.json()['total'] >= 1

    update = client.patch(f'/api/admin/orders/{order_number}/status', json={'order_status': 'Shipped'}, headers=headers)
    assert update.status_code == 200
    assert update.json()['order_status'] == 'Shipped'


def test_reports_require_auth():
    assert client.get('/api/admin/reports?period=7d').status_code == 401


def test_reports_reflect_real_orders(admin_token):
    headers = {'Authorization': f'Bearer {admin_token}'}
    resp = client.get('/api/admin/reports?period=30d', headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body['summary']['total_orders'] >= 1
    assert len(body['daily_sales']) == 30


def test_excel_export_is_a_real_xlsx(admin_token):
    resp = client.get('/api/admin/reports/export/excel?period=7d', headers={'Authorization': f'Bearer {admin_token}'})
    assert resp.status_code == 200
    assert resp.content[:2] == b'PK'  # xlsx is a zip archive


def test_pdf_export_is_a_real_pdf(admin_token):
    resp = client.get('/api/admin/reports/export/pdf?period=7d', headers={'Authorization': f'Bearer {admin_token}'})
    assert resp.status_code == 200
    assert resp.content[:4] == b'%PDF'
