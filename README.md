# OptiStack Supplement Manager

A Docker-deployable web application for managing your supplement stack with scheduling, tracking, and OIDC authentication support.

## Quick Start

### 1. Clone and Configure

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` with your configuration:

**Required secrets** — Generate secure random values for these:
```bash
# Run this command twice, once for each secret
openssl rand -base64 48
```

- `JWT_SECRET` — Signs authentication tokens. If compromised, attackers could forge login sessions.
- `SESSION_SECRET` — Signs session cookies. Keeps user sessions secure between requests.

**Admin user** — Set `ADMIN_PASSWORD` for the default admin account (username defaults to `admin`).

### 2. Run with Docker

```bash
docker compose up -d
```

The application will be available at `http://localhost:3000`

### 3. Login

On first startup, a default admin user is created:
- **Username:** `admin` (or value of `ADMIN_USERNAME`)
- **Password:** The value you set for `ADMIN_PASSWORD`

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | ✅ | - | Secret key for JWT token signing |
| `SESSION_SECRET` | ✅ | - | Secret key for session encryption |
| `ADMIN_PASSWORD` | ✅* | - | Password for default admin user |
| `ADMIN_USERNAME` | ❌ | `admin` | Username for default admin user |
| `FRONTEND_URL` | ❌ | `http://localhost:3000` | Frontend URL for redirects |
| `OIDC_ISSUER` | ❌ | - | OIDC provider issuer URL |
| `OIDC_AUTH_URL` | ❌ | - | OIDC authorization endpoint |
| `OIDC_TOKEN_URL` | ❌ | - | OIDC token endpoint |
| `OIDC_USERINFO_URL` | ❌ | - | OIDC userinfo endpoint |
| `OIDC_CLIENT_ID` | ❌ | - | OIDC client ID |
| `OIDC_CLIENT_SECRET` | ❌ | - | OIDC client secret |
| `OIDC_CALLBACK_URL` | ❌ | `http://localhost:3000/auth/callback` | OIDC callback URL |

*If `ADMIN_PASSWORD` is not set, the first user to register will become admin.

## Features

- 📋 Track supplements with dosage, schedule, and pricing
- 🕐 Morning/Evening pill scheduling
- 🔗 Amazon product scraping for auto-fill
- 👤 User accounts with local or OIDC authentication
- 🔐 Admin dashboard for user and settings management

## Development

```bash
# Install dependencies
npm install

# Run frontend dev server
npm run dev

# Run backend server (separate terminal)
npm run server
```

## License

MIT
