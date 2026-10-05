from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import admin_orders, admin_reports, auth, orders, products

app = FastAPI(title='GHOSTER API')

app.add_middleware(
    CORSMiddleware, allow_origins=settings.cors_origin_list, allow_credentials=True,
    allow_methods=['*'], allow_headers=['*'], expose_headers=['Content-Disposition'],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(admin_orders.router)
app.include_router(admin_reports.router)


@app.get('/api/health')
def health():
    return {'status': 'ok'}
