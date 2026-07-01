# Production Deployment

How to run Balloons Breeze in production on a single Linux server (Ubuntu 22/24)
using Docker Compose, behind the **host's own nginx** as an HTTPS reverse proxy.

Companion docs: [`RUN.md`](./RUN.md) (running locally / compose basics),
[`ENV.md`](./ENV.md) (every variable), [`ADMIN.md`](./ADMIN.md) (admin access).

---

## Architecture & port model

Three containers on an internal Docker bridge (`bbnet`):

| Service   | Image               | Where it listens          | Published to host?                       |
|-----------|---------------------|---------------------------|------------------------------------------|
| `db`      | postgres:16-alpine  | 5432 (internal only)      | **No** — internal bridge only            |
| `backend` | Express (node:20)   | 4000 (`expose`, internal) | **No** — internal bridge only            |
| `web`     | nginx:alpine        | 80 in-container           | **Yes**, but only `127.0.0.1:${WEB_PORT}`|

The `web` nginx serves the static Next.js export **and** reverse-proxies `/api/`
and `/uploads/` to `backend:4000`, and enforces HTTP Basic Auth on `/admin-bb`.

In production (`docker-compose.prod.yml`) the web port is bound to **loopback
only**, so the container is unreachable from the internet directly. The host's
nginx terminates TLS on 80/443 and forwards to `127.0.0.1:${WEB_PORT}`.

```
Internet ──80/443──▶ host nginx (TLS) ──▶ 127.0.0.1:8080 ──▶ web container
                                                               ├─ static site
                                                               ├─ /api/     → backend:4000
                                                               └─ /uploads/ → backend:4000
```

**Only ONE host port is occupied by the app: `127.0.0.1:${WEB_PORT}` (default
8080), and it's not even public.** Ports 5432 (db) and 4000 (backend) live only
on the compose bridge — never on the host.

---

## 1. Prerequisites

- A server running Ubuntu 22.04 or 24.04 with root/sudo access.
- A domain name with a **DNS A record pointing to the server's public IP**
  (and AAAA if you have IPv6). Wait for it to propagate before requesting certs.
- Ports 80 and 443 reachable from the internet (see the firewall step).

---

## 2. Install Docker + the Compose plugin

Using Docker's official convenience script:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable --now docker

# (optional) run docker without sudo — log out/in afterwards
sudo usermod -aG docker "$USER"

# verify — Compose v2 ships as a docker plugin ("docker compose", not "docker-compose")
docker --version
docker compose version
```

---

## 3. Get the code

```bash
sudo mkdir -p /opt && cd /opt
git clone <YOUR_REPO_URL> balloons-breeze
cd balloons-breeze
```

---

## 4. Configure environment

```bash
cp .env.production.example .env
chmod 600 .env
```

Now generate strong secrets and paste them into `.env`:

```bash
openssl rand -hex 32     # → JWT_SECRET
openssl rand -base64 18  # → ADMIN_PASSWORD, EDGE_AUTH_PASSWORD
openssl rand -hex 24     # → POSTGRES_PASSWORD
```

Edit `.env` and set, at minimum:

- `POSTGRES_PASSWORD` — strong; and make the password inside **`DATABASE_URL`
  match it exactly** (same string, both places).
- `JWT_SECRET` — long random (mandatory in production; the backend fails fast
  without it).
- `ADMIN_PASSWORD` and `EDGE_AUTH_PASSWORD` — strong; do not ship the defaults.
- `CORS_ORIGIN=https://your-domain.com` — your real domain.
- `WEB_PORT=8080` — leave unless 8080 is taken (see the preflight step).

> **NEVER commit `.env`.** It contains live secrets. It should already be
> git-ignored; keep it that way and back it up out-of-band.

---

## 5. Preflight: check host ports

```bash
sudo ss -ltnp | grep -E ':(80|443|8080)' || echo "80/443/8080 are free"
```

- If **80/443** are already used by another site's nginx, you'll integrate this
  server block into that existing nginx (step 8) rather than conflicting.
- If **8080** is taken, pick a free port and set `WEB_PORT=<port>` in `.env`,
  then update the two `proxy_pass http://127.0.0.1:8080;` lines in your host
  nginx config to match.

---

## 6. Launch the stack

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Check status and logs:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
```

On first boot the backend runs `prisma db push` then the **idempotent seed**
(admin user from `ADMIN_USERNAME`/`ADMIN_PASSWORD`, default photo groups). The
`web` container waits until the backend healthcheck (`GET /api/health`) passes
before starting.

Quick local check (from the server itself, before the domain/TLS is set up):

```bash
curl -I http://127.0.0.1:8080/
curl http://127.0.0.1:8080/api/health   # → {"ok":true}
```

> Tip: the two `-f` flags are required on **every** compose command in
> production. Consider an alias:
> `alias dcp='docker compose -f docker-compose.yml -f docker-compose.prod.yml'`

---

## 7. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80,443/tcp
sudo ufw enable
sudo ufw status
```

**Do NOT open 8080** (or 4000/5432) to the world. The app is bound to
`127.0.0.1:8080` and must only be reached through the host nginx on 80/443.

---

## 8. Host nginx + HTTPS (Let's Encrypt)

Install nginx and certbot:

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
sudo mkdir -p /var/www/certbot     # for the ACME HTTP-01 challenge
```

Drop in the example server block and edit the domain:

```bash
sudo cp deploy/nginx-host.conf.example /etc/nginx/sites-available/balloons-breeze.conf
sudo sed -i 's/your-domain.com/REAL-DOMAIN.com/g' /etc/nginx/sites-available/balloons-breeze.conf
sudo ln -s /etc/nginx/sites-available/balloons-breeze.conf /etc/nginx/sites-enabled/
# optional: remove the default site so it doesn't shadow yours
sudo rm -f /etc/nginx/sites-enabled/default
```

Obtain the certificate (certbot will edit/validate the config and reload nginx):

```bash
sudo certbot --nginx -d REAL-DOMAIN.com
sudo nginx -t && sudo systemctl reload nginx
```

Renewal is automatic via certbot's systemd timer. Test it with:

```bash
sudo certbot renew --dry-run
```

---

## 9. Verify

```bash
curl -I https://REAL-DOMAIN.com/                 # 200, HTML
curl https://REAL-DOMAIN.com/api/health          # {"ok":true}
```

Admin: open `https://REAL-DOMAIN.com/admin-bb`. You'll be prompted **twice** —
first the browser's HTTP Basic Auth dialog (edge: `EDGE_AUTH_USER` /
`EDGE_AUTH_PASSWORD`), then the in-app login form (JWT: `ADMIN_USERNAME` /
`ADMIN_PASSWORD`). See [`ADMIN.md`](./ADMIN.md).

---

## 10. Security checklist (change before go-live)

- [ ] `JWT_SECRET` — long random (e.g. `openssl rand -hex 32`), not the placeholder.
- [ ] `POSTGRES_PASSWORD` — strong, and the copy inside `DATABASE_URL` matches.
- [ ] `ADMIN_PASSWORD` — strong (not `bbreeze-admin`).
- [ ] `EDGE_AUTH_PASSWORD` — strong (not `bbreeze-edge`).
- [ ] `CORS_ORIGIN=https://REAL-DOMAIN.com` (your real domain, not `*`).
- [ ] `NODE_ENV=production`.
- [ ] `.env` is `chmod 600` and NOT committed.
- [ ] Firewall allows only SSH + 80/443; 8080/4000/5432 are not public.

---

## 11. Operations

Set `alias dcp='docker compose -f docker-compose.yml -f docker-compose.prod.yml'`
first (used below).

**Update / redeploy:**

```bash
cd /opt/balloons-breeze
git pull
dcp up -d --build
```

**Logs / restart / stop:**

```bash
dcp logs -f backend        # or web / db
dcp restart backend
dcp ps
dcp down                   # stop (keeps volumes: db data + uploads)
dcp down -v                # stop AND WIPE db + uploads — destructive
```

**Backups.** Two things carry state: the Postgres `pgdata` volume and the
`uploads` volume. Back both up regularly.

```bash
# Database dump (use the POSTGRES_USER / POSTGRES_DB from your .env):
dcp exec -T db pg_dump -U bb balloons > backup-$(date +%F).sql

# Uploaded images (copy the volume contents out via a throwaway container):
docker run --rm -v balloons-breeze_uploads:/data -v "$PWD":/backup alpine \
  tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```

> The `_uploads`/`_pgdata` volume names are prefixed with the compose project
> name (the directory, `balloons-breeze`). Confirm with `docker volume ls`.

**Restore:**

```bash
# Database (stack running, db up):
cat backup-YYYY-MM-DD.sql | dcp exec -T db psql -U bb -d balloons

# Uploads:
docker run --rm -v balloons-breeze_uploads:/data -v "$PWD":/backup alpine \
  sh -c "cd /data && tar xzf /backup/uploads-YYYY-MM-DD.tar.gz"
```

---

## 12. Troubleshooting

**Port already in use.** `sudo ss -ltnp | grep -E ':(80|443|8080)'`. Change
`WEB_PORT` in `.env` (and the host nginx `proxy_pass` ports) if 8080 clashes;
resolve any existing service on 80/443 before enabling this nginx site.

**SSE not streaming (chat/photos/texts/reviews don't update live).** A proxy is
buffering. The container nginx already streams correctly; make sure the **host**
nginx `/api/` block keeps `proxy_buffering off;`, `proxy_cache off;`,
`proxy_http_version 1.1;`, `proxy_set_header Connection "";` and a long
`proxy_read_timeout` (all present in `deploy/nginx-host.conf.example`).

**DB not ready on first boot.** The backend waits on the db healthcheck and
`web` waits on the backend healthcheck, so this normally self-resolves. If the
backend keeps restarting, check `dcp logs backend` — usually a `DATABASE_URL`
password mismatch with `POSTGRES_PASSWORD`.

**Uploads fail with 413 (Request Entity Too Large).** The host nginx needs
`client_max_body_size 12m;` (exceeds `MAX_UPLOAD_MB=8` plus multipart overhead).
It's set in the example conf — confirm you copied that block.

**Admin locked out / forgot password.** Set a new `ADMIN_PASSWORD` in `.env` and
restart — the seed re-syncs (upserts) the admin user's bcrypt hash on every
start: `dcp up -d` (or `dcp restart backend`). For the edge Basic Auth prompt,
change `EDGE_AUTH_PASSWORD` and `dcp up -d --force-recreate web`. See
[`ADMIN.md`](./ADMIN.md).

**"Missing required env var: JWT_SECRET".** In production the backend fails fast
without it — set `JWT_SECRET` in `.env` and restart.

---

See also: [`RUN.md`](./RUN.md) · [`ENV.md`](./ENV.md) · [`ADMIN.md`](./ADMIN.md).
