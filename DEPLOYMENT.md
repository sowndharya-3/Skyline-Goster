# Deploying GHOSTER to a Hostinger KVM 4 VPS

Stack: React (Vite) frontend, Python/FastAPI backend, PostgreSQL database.
Target layout on the server: `/var/www/ghoster/{frontend,backend}`, Nginx in front,
the backend run by Gunicorn+Uvicorn workers under systemd.

Replace `YOURDOMAIN` and all placeholder values below with your real ones.

---

## 1. Upload the project

From your local machine, with the project ZIP extracted locally:

```sh
scp -r ghoster-production/ root@YOUR_VPS_IP:/var/www/ghoster
```

Or upload the ZIP itself and unzip on the server:

```sh
scp ghoster-production.zip root@YOUR_VPS_IP:/var/www/
ssh root@YOUR_VPS_IP
cd /var/www && unzip ghoster-production.zip && mv ghoster-production ghoster
```

## 2. System dependencies

```sh
apt update && apt upgrade -y
apt install -y curl git build-essential nginx postgresql postgresql-contrib \
  python3 python3-venv python3-pip ufw
```

## 3. Install Node.js (for the frontend build)

```sh
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node -v   # confirm v22.x
```

## 4. Install Python (already present above) and confirm version

```sh
python3 --version   # 3.11+ recommended
```

## 5. Install and configure PostgreSQL

```sh
systemctl enable --now postgresql
sudo -u postgres psql
```

Inside `psql`:

```sql
CREATE USER ghoster WITH PASSWORD 'choose-a-strong-password';
CREATE DATABASE ghoster OWNER ghoster;
\q
```

By default PostgreSQL only listens on localhost — leave it that way unless the backend
runs on a different host. Do **not** expose port 5432 to the public internet (see §16).

## 6. Create the production database

Already done in step 5 (`CREATE DATABASE ghoster`). The actual tables are created by
migrations next, not by hand.

## 7. Configure the backend

```sh
cd /var/www/ghoster/backend
cp .env.example .env
nano .env
```

Fill in real values:
- `DATABASE_URL=postgresql+psycopg2://ghoster:<password>@localhost:5432/ghoster`
- `SECRET_KEY` — generate with `python3 -c "import secrets; print(secrets.token_urlsafe(64))"`
- `CORS_ORIGINS=https://YOURDOMAIN`
- Leave `GUNICORN_*` at defaults unless you know you need to change them.

Create the virtualenv and install dependencies:

```sh
python3 -m venv .venv
./.venv/bin/pip install --upgrade pip
./.venv/bin/pip install -r requirements.txt
```

## 8. Run database migrations

```sh
cd /var/www/ghoster/backend
./.venv/bin/alembic upgrade head
```

Optionally seed the admin user and starter catalogue. Product rows are upserted
(safe to re-run), but the admin user is only ever created once — re-running never
resets its password, so it's safe to include in future redeploys too:

```sh
SEED_ADMIN_PASSWORD='choose-a-real-password' ./.venv/bin/python scripts/seed_demo.py
```

Omit `SEED_ADMIN_PASSWORD` and it falls back to the public demo login
(`admin@ghosterstudio.com` / `ghoster123`, the same one shown in the UI) — fine for a
demo, but set your own for a real deployment.

## 9. Build the React frontend

```sh
cd /var/www/ghoster/frontend
cp .env.example .env.production
nano .env.production
```

Set `VITE_API_URL=https://YOURDOMAIN` (bare origin, no `/api` suffix — the app's own
code already calls `/api/...`).

```sh
npm ci
npm run build
```

This produces `frontend/dist/` — the static files Nginx will serve.

## 10. Configure the backend as a service (Gunicorn + systemd)

```sh
useradd --system --home /var/www/ghoster --shell /bin/false ghoster || true
chown -R ghoster:ghoster /var/www/ghoster

cp /var/www/ghoster/deployment/systemd/ghoster-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable ghoster-backend
systemctl start ghoster-backend
systemctl status ghoster-backend
```

The service runs `gunicorn -c gunicorn_conf.py app.main:app` from `backend/`, binding
to `127.0.0.1:8000` by default (see `backend/gunicorn_conf.py` / `GUNICORN_BIND`).

## 11. Configure Nginx

```sh
cp /var/www/ghoster/deployment/nginx/ghoster.conf.template /etc/nginx/sites-available/ghoster.conf
nano /etc/nginx/sites-available/ghoster.conf   # replace YOURDOMAIN
ln -s /etc/nginx/sites-available/ghoster.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

This serves `frontend/dist` at `/` and reverse-proxies `/api/*` to the backend.

## 12. Set environment variables

Already done in steps 7 and 9 (`backend/.env`, `frontend/.env.production`). Never commit
these files — they hold real secrets. `.gitignore` in this package already excludes them.

## 13. Start/restart the backend service

```sh
systemctl restart ghoster-backend
systemctl status ghoster-backend
journalctl -u ghoster-backend -f    # follow logs
```

## 14. Connect the domain

At your domain registrar / DNS provider, point an **A record** for `YOURDOMAIN` (and
`www.YOURDOMAIN` if used) to the VPS's public IP address. DNS propagation can take a
few minutes to a few hours.

## 15. Configure SSL/HTTPS

```sh
apt install -y certbot python3-certbot-nginx
certbot --nginx -d YOURDOMAIN -d www.YOURDOMAIN
```

Certbot edits the Nginx config to add the HTTPS server block and sets up auto-renewal
(`systemctl status certbot.timer` to confirm). After this, set `CORS_ORIGINS` in
`backend/.env` to the `https://` URL and restart the backend service.

## 16. Firewall

```sh
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

Do not open port 5432 (PostgreSQL) or 8000 (backend) to the public — both are only
reached locally, via Nginx and localhost respectively.

## 17. Test the frontend

Visit `https://YOURDOMAIN` in a browser. You should see the GHOSTER homepage, be able
to browse products, add to bag, and complete a demo checkout.

## 18. Test the backend APIs

```sh
curl -s https://YOURDOMAIN/api/health
curl -s https://YOURDOMAIN/api/products | head -c 300
```

Log in to the admin workspace at `https://YOURDOMAIN/#/admin` with the seeded (or your
changed) admin credentials and confirm the Overview/Orders/Reports pages load.

## 19. Check application logs

```sh
journalctl -u ghoster-backend -n 100 --no-pager   # backend app + gunicorn
tail -f /var/log/nginx/error.log                  # Nginx errors
tail -f /var/log/nginx/access.log                 # Nginx access
```

## 20. Restarting services after future code updates

```sh
cd /var/www/ghoster
./deployment/scripts/deploy.sh
```

This rebuilds the frontend, reinstalls backend dependencies, runs any new migrations,
and restarts `ghoster-backend` + reloads Nginx. Or do it by hand:

```sh
cd frontend && npm ci && npm run build && cd ..
cd backend && ./.venv/bin/pip install -r requirements.txt && ./.venv/bin/alembic upgrade head && cd ..
systemctl restart ghoster-backend
nginx -t && systemctl reload nginx
```

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Frontend loads but API calls fail (CORS error in console) | `CORS_ORIGINS` in `backend/.env` doesn't match the actual frontend origin, or backend service wasn't restarted after editing `.env` |
| `502 Bad Gateway` from Nginx | `ghoster-backend` service isn't running — check `systemctl status ghoster-backend` and `journalctl -u ghoster-backend` |
| Admin login fails with correct credentials | `scripts/seed_demo.py` wasn't run, or `SECRET_KEY` changed after tokens were issued (old sessions just need to log in again) |
| Migrations fail with a connection error | `DATABASE_URL` in `backend/.env` is wrong, or PostgreSQL isn't running (`systemctl status postgresql`) |
