# Database

PostgreSQL. Alembic migrations are the source of truth for the schema and live in
`backend/alembic/` (they run against the SQLAlchemy models in `backend/app/models/`).

- `schema/schema.sql` — a schema-only `pg_dump` snapshot of the current structure, for
  reference/review only. To actually create or update a database, run the migrations
  (see DEPLOYMENT.md), not this file.
- `seed/seed_demo.py` — copy of `backend/scripts/seed_demo.py`. Seeds the admin user
  (created once only — re-running never resets its password) and the initial product
  catalogue (safe to re-run, upserted). After the first migration:
  `cd backend && SEED_ADMIN_PASSWORD='your-password' .venv/bin/python scripts/seed_demo.py`

Tables: `users`, `customers`, `products`, `orders`, `order_items`, `alembic_version`.
