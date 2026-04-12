# DivineMarg platform

**DivineMarg** is an astrology platform monorepo: users discover verified astrologers, start wallet-funded live chat sessions (with real-time updates via Socket.IO), and recharge using Razorpay. A separate admin app manages users, astrologers, transactions, and platform settings.

## Tech stack

| Area | Technology |
| --- | --- |
| Web app | Next.js 14 (App Router), React 18, Tailwind CSS, Zustand |
| Admin app | Next.js 14, React 18, Tailwind CSS, Zustand |
| API | Node.js 20, Express, Socket.IO |
| Data | PostgreSQL 16, `pg` driver |
| Cache / OTP | Redis 7 |
| Payments | Razorpay (orders + verify) |
| Auth | JWT (`jsonwebtoken`), bcrypt for passwords |
| Shared code | `divinemarg-shared` workspace (Zod, types) |
| Mobile | Expo app under `apps/mobile` (optional) |

## Local development

1. **Requirements:** Node.js 18+, npm, PostgreSQL, and Redis running locally (or use Docker only for DBs).

2. **Install dependencies** from the repository root:

   ```bash
   npm install
   ```

3. **Environment file:** create a `.env` file at the **repository root** (backend and tooling load it from here). See [Environment variables](#environment-variables) below for all keys.

4. **Database URL:** point `DATABASE_URL` at an empty database, then apply the schema:

   ```bash
   npm run migrate --workspace=divinemarg-backend
   ```

   This runs `backend/src/db/schema.sql` once. Use a fresh database for the first run.

5. **Start services** in separate terminals:

   ```bash
   npm run dev:backend
   npm run dev:web
   npm run dev:admin
   ```

   Defaults: API `http://localhost:4000`, web `http://localhost:3000`, admin `http://localhost:3001` (run admin with `npm run dev --workspace=divinemarg-admin -- -p 3001` if you need that port).

6. **Health check:** `GET http://localhost:4000/health` should return `{ "ok": true }`.

## Production deployment

### 1. Server prerequisites

- Docker Engine and Docker Compose v2
- Git, SSH access, and a clone of this repo on the server (e.g. `/var/www/divinemarg-platform`)
- DNS: point `yourdomain.com`, `www.yourdomain.com`, and `admin.yourdomain.com` to the server (replace placeholders in `nginx/nginx.conf`)

### 2. Environment

Copy and fill a `.env` file next to `docker-compose.prod.yml` (see [Environment variables](#environment-variables)). Ensure `DATABASE_URL` uses the Docker service hostname `postgres` and `REDIS_URL` uses `redis://redis:6379` when using the bundled Redis service.

### 3. TLS certificates (optional but recommended)

The default `nginx/nginx.conf` terminates **HTTP on port 80** only. To serve **HTTPS on 443**, add `listen 443 ssl` server blocks (duplicate the `server { ... }` blocks with TLS directives), map `443:443` on the `nginx` service in `docker-compose.prod.yml`, and mount certificate files (for example `./nginx/ssl` with `fullchain.pem` and `privkey.pem`). You can obtain certificates with Let’s Encrypt (certbot) or your cloud load balancer.

### 4. Build and run

From the repo root on the server:

```bash
docker compose -f docker-compose.prod.yml --env-file .env up --build -d
```

After Postgres is up, run migrations **once** against an **empty** database (same as local `npm run migrate --workspace=divinemarg-backend`):

```bash
docker compose -f docker-compose.prod.yml run --rm --env-file .env backend node backend/dist/db/migrate.js
```

Alternatively, from the host with `DATABASE_URL` pointing at production: `npm run migrate --workspace=divinemarg-backend`.

### 5. GitHub Actions deploy

Workflow: `.github/workflows/deploy.yml` — runs on every push to `main`.

Configure the repository:

- **Secrets:** `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY` (deploy key or user key with pull access)
- **Variables:** `DEPLOY_PATH` — absolute path to the repo on the server (e.g. `/var/www/divinemarg-platform`)

The job SSHs in, runs `git pull origin main`, then `docker compose -f docker-compose.prod.yml --env-file .env up --build -d`.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string (e.g. `postgresql://USER:PASSWORD@postgres:5432/DB` in Docker). |
| `REDIS_URL` | Yes | Redis URL (e.g. `redis://redis:6379` with Compose). |
| `JWT_SECRET` | Yes | Secret for signing JWTs (use a long random string in production). |
| `PORT` | No | API port (default `4000`). |
| `RAZORPAY_KEY_ID` | For payments | Razorpay key id (exposed to the client when creating orders). |
| `RAZORPAY_KEY_SECRET` | For payments | Razorpay secret for server-side verification. |
| `POSTGRES_USER` | Docker DB | Postgres user (default `divinemarg` in Compose). |
| `POSTGRES_PASSWORD` | Docker DB | Postgres password (set in `.env`). |
| `POSTGRES_DB` | Docker DB | Database name (default `divinemarg`). |
| `NEXT_PUBLIC_API_URL` | **Build** (web/admin) | Public origin of the API **as the browser will call it** (e.g. `https://yourdomain.com` when Nginx serves `/api` on the same host). Must be set at **image build** time for the Next.js apps. |
| `NEXT_PUBLIC_WEB_URL` | **Build** (admin) | Public URL of the marketing/web app (used for links from admin; e.g. `https://yourdomain.com`). |

**Docker Compose** loads `.env` for interpolation and passes relevant values into containers. Rebuild web and admin images whenever you change `NEXT_PUBLIC_*` values.

## White-label guide

Branding is not fully centralized; update these areas for a new name and look:

1. **Site title and SEO:** `apps/web/app/layout.tsx` and `apps/admin/app/layout.tsx` — `metadata.title` and `metadata.description`.
2. **Logo:** replace or add assets under `apps/web/app/` / `apps/admin/app/` (and any components that render the logo).
3. **Colors:** both apps use Tailwind with CSS variables in `apps/*/app/globals.css` (`:root` `--background`, `--foreground`). Extend `tailwind.config.ts` `theme.extend.colors` for a primary brand color and use it in components.
4. **Runtime copy:** search the repo for visible product strings and update as needed.
5. **Platform settings (optional):** after deployment, admins can persist key/value settings via `GET/PUT /api/admin/settings` (stored in `platform_settings`) for values you wire up in the UI later.

## First admin account

There is no self-service admin registration. Create a row in the `admins` table with a **bcrypt** hash of your password.

1. Generate a hash (Node one-liner):

   ```bash
   node -e "console.log(require('bcryptjs').hashSync('YourSecurePassword', 10))"
   ```

2. Insert into Postgres (run via `psql` or a SQL client):

   ```sql
   INSERT INTO admins (email, password_hash, role)
   VALUES ('admin@divinemarg.com', '<paste bcrypt hash here>', 'superadmin');
   ```

3. Log in through the admin app at `POST /api/admin/login` (the login page calls this) with the same email and plaintext password.

## API endpoints (summary)

Base path in production is often `https://yourdomain.com/api` behind Nginx. The Express app mounts routers under `/api`.

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/health` | Liveness check (no auth). |
| **Auth** | | |
| `POST` | `/api/auth/send-otp` | Send OTP to phone (stored in Redis). |
| `POST` | `/api/auth/verify-otp` | Verify OTP; returns JWT + user. |
| `POST` | `/api/auth/astrologer/login` | Astrologer email/password login. |
| `GET` | `/api/auth/me` | Current user profile (Bearer token). |
| **Users** | | |
| `GET` | `/api/users/profile` | Authenticated user profile. |
| `PUT` | `/api/users/profile` | Update name / avatar. |
| `GET` | `/api/users/wallet` | Balance + recent transactions. |
| **Astrologers** | | |
| `GET` | `/api/astrologers` | List/filter astrologers (public). |
| `GET` | `/api/astrologers/:id` | Detail + reviews. |
| `GET` | `/api/astrologers/dashboard` | Astrologer dashboard (astrologer JWT). |
| `PUT` | `/api/astrologers/profile` | Astrologer profile (astrologer JWT). |
| `PUT` | `/api/astrologers/availability` | Toggle availability (astrologer JWT). |
| **Chat** | | |
| `POST` | `/api/chat/request` | Start chat session (user JWT). |
| `POST` | `/api/chat/end/:sessionId` | End session and bill (user JWT). |
| `GET` | `/api/chat/history` | Session history (user or astrologer JWT). |
| **Wallet** | | |
| `POST` | `/api/wallet/create-order` | Create Razorpay order (user JWT). |
| `POST` | `/api/wallet/verify-payment` | Verify Razorpay payment (user JWT). |
| `GET` | `/api/wallet/transactions` | Paginated transactions (user JWT). |
| **Admin** | | |
| `POST` | `/api/admin/login` | Admin email/password → JWT. |
| `GET` | `/api/admin/stats` | Dashboard stats (admin JWT). |
| `GET` | `/api/admin/transactions` | All transactions with filters (admin JWT). |
| `GET` | `/api/admin/astrologers` | List astrologers (admin JWT). |
| `POST` | `/api/admin/astrologers/:id/verify` | Verify astrologer (admin JWT). |
| `POST` | `/api/admin/astrologers/:id/suspend` | Suspend astrologer (admin JWT). |
| `GET` | `/api/admin/users` | List users (admin JWT). |
| `POST` | `/api/admin/users/:id/suspend` | Suspend user (admin JWT). |
| `GET` | `/api/admin/settings` | Platform settings (admin JWT). |
| `PUT` | `/api/admin/settings` | Update platform settings (admin JWT). |

**WebSocket:** Socket.IO is served from the same origin as the API (`/socket.io`). Configure Nginx with HTTP upgrade headers (see `nginx/nginx.conf`).

---

For Docker-specific filenames, see `docker-compose.prod.yml`, `backend/Dockerfile`, `apps/web/Dockerfile`, and `apps/admin/Dockerfile`.
