# Deployment

The repository ships one `Dockerfile` with a target per surface and
`compose.prod.yaml`, which runs the whole stack on one host: Postgres,
a one-shot migrate + seed step, the API, the worker, web and admin.

```mermaid
flowchart LR
  subgraph internet["Internet"]
    u1([www.example.com])
    u2([admin.example.com])
    u3([api.example.com<br/>mobile])
  end
  proxy["reverse proxy<br/>TLS (Caddy, nginx…)"]
  subgraph host["compose.prod.yaml"]
    web["web :3000"]
    admin["admin :3002"]
    api["api :3001"]
    worker["worker"]
    migrate["migrate + seed<br/>(one-shot)"]
    pg[("postgres<br/>volume")]
    st[("storage<br/>volume")]
  end
  smtp[["SMTP provider"]]
  u1 --> proxy
  u2 --> proxy
  u3 --> proxy
  proxy --> web
  proxy --> admin
  proxy --> api
  web --> api
  admin --> api
  api --> pg
  api --> st
  worker --> pg
  worker --> smtp
  migrate --> pg
```

## 1. Prepare the server

Any Linux host with Docker and the Compose plugin. Point DNS for your web,
admin and (if mobile is used) API hostnames at it.

```bash
git clone https://github.com/2tsoftwareapp/super-template.git app && cd app
cp .env.production.example .env.production
```

## 2. Fill in `.env.production`

Replace every value. At minimum:

| Variable                        | Value                                                 |
| ------------------------------- | ----------------------------------------------------- |
| `POSTGRES_PASSWORD`             | a long random password                                |
| `JWT_ACCESS_SECRET`             | `openssl rand -base64 48`                             |
| `SMTP_URL`, `MAIL_FROM`         | your mail provider (`smtp://user:pass@host:587`)      |
| `WEB_URL`, `WEB_ORIGIN`         | `https://www.example.com` — the reset mail links here |
| `ADMIN_URL`, `ADMIN_ORIGIN`     | `https://admin.example.com`                           |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | the first admin; the seed creates it once             |
| `ALLOW_REGISTRATION`            | `false` if only admins create accounts                |
| `CORS_ORIGINS`                  | empty unless a browser app calls the API directly     |

All variables: [Configuration](./configuration).

## 3. Start it

```bash
bun run prod:up
# same as: docker compose -f compose.prod.yaml --env-file .env.production up -d --build
```

Order on every start: Postgres becomes healthy → `migrate` applies new
migrations and seeds the admin (idempotent) → API starts and passes its health
check → worker, web and admin start.

```bash
docker compose -f compose.prod.yaml --env-file .env.production ps
curl -s localhost:3001/api/v1/health      # {"status":"ok","database":"ok"}
```

## 4. Put TLS in front

The containers speak plain HTTP. Terminate TLS in a reverse proxy on the host.
Example with [Caddy](https://caddyserver.com), which obtains certificates
automatically:

```
www.example.com {
  reverse_proxy localhost:3000
}
admin.example.com {
  reverse_proxy localhost:3002
}
api.example.com {
  reverse_proxy localhost:3001
}
```

- Cookies are `Secure` in production, so web and admin only work over HTTPS.
- `TRUST_PROXY` decides whose `X-Forwarded-For` the API believes for rate
  limits. The default `uniquelocal` trusts private addresses (the BFFs on the
  compose network); adjust it if your proxy reaches the API differently.
- If you expose the API only to mobile, raise the proxy's body size limit to at
  least `MAX_UPLOAD_BYTES`.
- Expose only the proxy's ports publicly; keep 3000–3002 and Postgres firewalled.

## Update

```bash
git pull
bun run prod:up        # rebuilds images, runs new migrations, restarts changed services
```

Migrations run before the new API starts. Write them so the previous API
version keeps working while they apply (add columns before using them; drop
them a release later).

## Logs and health

- `NODE_ENV=production` makes the API and worker log one JSON object per line,
  with the request id. Read them with
  `docker compose -f compose.prod.yaml logs -f api worker`.
- Every response carries `x-request-id`; search the logs for it.
- `/api/v1/health` returns 503 when Postgres is unreachable; Docker marks the
  API container unhealthy after five failures.

## Backups

Two things hold state: the `postgres-data` and `api-storage` volumes.

```bash
# database
docker compose -f compose.prod.yaml --env-file .env.production exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > backup-$(date +%F).sql.gz

# uploaded files
docker run --rm -v lean-prod_api-storage:/data -v "$PWD":/out alpine \
  tar czf /out/storage-$(date +%F).tgz -C /data .
```

Restore into an empty database with `gunzip -c backup.sql.gz | docker compose … exec -T postgres psql -U … …`.
Test a restore before you need one.

## Scale

- **Worker**: `… up -d --scale worker=3`. Jobs are claimed with `SKIP LOCKED`.
- **API**: stateless except for uploads in `STORAGE_DIR`. Run several copies
  only with shared storage (a network volume) behind a load balancer.
- **Database**: point `DATABASE_URL` at a managed Postgres and remove the
  `postgres` service.

## Without Docker

```bash
bun install --frozen-lockfile
bun run build                                   # API, worker, db scripts, admin, web
node packages/db/dist/migrate.js && node packages/db/dist/seed.js
bun run --filter @lean/api start                # reads ../../.env when present
bun run --filter @lean/worker start
bun run --filter @lean/web start
bun run --filter @lean/admin start
```

Run each under a supervisor (systemd, pm2) and export the variables from
[Configuration](./configuration) (the API and worker also read a root `.env`).
`migrate.js` finds `../migrations` next to its own folder; set `MIGRATIONS_DIR`
if you move it. Web and admin build a standalone server in `.next/standalone`,
which is what the Docker images run.
