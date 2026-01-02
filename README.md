# OptiStack Supplement & Medication Manager

A Docker-deployable web application for managing your supplement and medication stack with seeking, tracking, and OIDC authentication support.

<details>
<summary>📸 Screenshots</summary>

### Dashboard

**Desktop**

![Desktop Dashboard](public/screenshots/SCR-20260101-rnfu.png)

**Mobile**

<p align="center">
  <img src="public/screenshots/SCR-20260101-rnon.png" width="300" alt="Mobile Dashboard">
</p>

### Add Supplement Form

**Desktop**

![Add Supplement Desktop](public/screenshots/SCR-20260101-rnur.png)

**Mobile**

<p align="center">
  <img src="public/screenshots/SCR-20260101-rnww.png" width="300" alt="Add Supplement Mobile">
</p>

</details>

## Quick Start

### Option A: Quick Deploy (Recommended)

Run OptiStack directly from GitHub Container Registry — no clone required:

```bash
# Download the production compose file and example environment
curl -O https://raw.githubusercontent.com/tylermiranda/OptiStack/main/docker-compose.production.yml
curl -O https://raw.githubusercontent.com/tylermiranda/OptiStack/main/.env.example

# Create your .env file
cp .env.example .env
# Edit .env with your settings (see Required Secrets below)

# Run OptiStack
docker compose -f docker-compose.production.yml up -d
```

The application will be available at `http://localhost:3000`

---

### Option B: Clone and Build Locally

```bash
git clone https://github.com/tylermiranda/OptiStack.git
cd OptiStack
cp .env.example .env
# Edit .env with your settings
docker compose up -d
```

---

### Configuration

Edit `.env` with your configuration:

**Required secrets** — Generate secure random values for these:
```bash
# Run this command twice, once for each secret
openssl rand -base64 48
```

- `JWT_SECRET` — Signs authentication tokens. If compromised, attackers could forge login sessions.
- `SESSION_SECRET` — Signs session cookies. Keeps user sessions secure between requests.

**Admin user** — Set `ADMIN_PASSWORD` for the default admin account (username defaults to `admin`).

### Login

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
| `OPENROUTER_API_KEY` | ❌ | - | [OpenRouter](https://openrouter.ai/keys) API key for AI analysis |
| `FRONTEND_URL` | ❌ | `http://localhost:3000` | Frontend URL for redirects |
| `OIDC_ISSUER` | ❌ | - | OIDC provider issuer URL |
| `OIDC_AUTH_URL` | ❌ | - | OIDC authorization endpoint |
| `OIDC_TOKEN_URL` | ❌ | - | OIDC token endpoint |
| `OIDC_USERINFO_URL` | ❌ | - | OIDC userinfo endpoint |
| `OIDC_CLIENT_ID` | ❌ | - | OIDC client ID |
| `OIDC_CLIENT_SECRET` | ❌ | - | OIDC client secret |
| `OIDC_CALLBACK_URL` | ❌ | `http://localhost:3000/auth/callback` | OIDC callback URL |
| `DISABLE_AUTH` | ❌ | `false` | Set to `true` to completely disable authentication (Single User Mode). **WARNING: Bypasses all login security.** |

*If `ADMIN_PASSWORD` is not set, the first user to register will become admin.

## Features

- 🔐 Admin dashboard for user and settings management
- 💊 Weekly Refill Assistant: Interactive checklist for easy pill organizer filling
- ⚖️ **Volume-based Costing**: Support for supplements by weight (grams, oz) or volume (ml) with accurate cost-per-day calculations
- 📄 **Comprehensive Doctor Report**: Export your daily supplement protocol + AI safety analysis to a professional PDF
- 📑 **Export AI Analysis**: Save your AI-powered interaction check results as a PDF report
- 📱 Mobile-optimized UI with safe-area support for iOS
- 🚀 PWA support for "Add to Home Screen" on iPhone/iPad
- ℹ️ **Smart Tooltips**: Enhanced interface with informative tooltips for actions and features
- 🩺 **Interaction Checker**: AI-powered safety check to identify potential negative interactions in your stack
- 💾 **Data Backup & Restore**: Securely backup your database and restore it with a single click
- 👤 **Single User Mode**: Optional mode to disable authentication for personal use or external auth
- 🤖 AI-powered supplement analysis (optional)

## AI Features (Optional)

OptiStack includes optional AI-powered features for analyzing supplements and your full stack:

- **Supplement Analysis**: Get AI-generated summaries, recommended dosages, side effects, and optimal timing
- **Stack Analysis**: Analyze your entire supplement protocol for synergies, benefits, and potential interactions

AI features are **disabled by default** and will only appear in the UI when you provide an OpenRouter API key:

1. Get a free API key from [OpenRouter](https://openrouter.ai/keys)
2. Add it to your `.env` file: `OPENROUTER_API_KEY=sk-or-...`
3. Restart the container

If no API key is configured, the AI sections are completely hidden from the UI.

> **Note:** Currently only [OpenRouter](https://openrouter.ai) is supported as an AI provider. Local AI support (e.g., Ollama) is planned for a future release.
## Mobile & PWA Support

OptiStack is designed to work seamlessly on mobile devices:
- **Responsive Layout**: Adapts to all screen sizes with a mobile-first approach.
- **iOS PWA Ready**: Includes a `webmanifest`, standard Apple meta tags, and high-resolution icons for a native-like experience when added to the home screen.
- **Safe Area Support**: Automatically handles notches and home indicators on modern iOS devices.

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
