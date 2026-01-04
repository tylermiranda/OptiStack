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
| `AI_PROVIDER` | ❌ | `openrouter` | AI provider: `openrouter` (cloud) or `ollama` (local) |
| `OPENROUTER_API_KEY` | ❌ | - | [OpenRouter](https://openrouter.ai/keys) API key for cloud AI |
| `OLLAMA_URL` | ❌ | `http://localhost:11434` | Ollama server URL for local AI |
| `OLLAMA_MODEL` | ❌ | `llama3.1:8b` | Default Ollama model to use |
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
- 💬 **AI Chat Assistant**: Conversational AI for discussing supplements, checking interactions, and getting personalized recommendations
- 🧬 **Bioavailability Tips**: Each supplement shows absorption tips—what to take with, what to avoid, and timing recommendations
- 📋 **Stack Templates**: Browse curated supplement stacks for performance, sleep, focus, and longevity goals
- 👤 **Influencer Stacks**: Pre-built templates from Andrew Huberman, Peter Attia, and more with source attribution
- 🔗 **Public Stack Sharing**: Generate shareable links for your stack that anyone can view and import
- 🩺 **Interaction Checker**: AI-powered safety check to identify potential negative interactions in your stack
- 🧠 **Stack Optimizer**: AI-powered suggestions for missing cofactors and complementary supplements
- 📊 **AI Analysis History**: Automatically saves every AI stack analysis for future reference with full details and timestamps
- 💾 **Data Backup & Restore**: Securely backup your database and restore it with a single click
- 👤 **Single User Mode**: Optional mode to disable authentication for personal use or external auth
- 💰 **AI Cost Tracking**: Monitor your Cloud AI usage and costs per user in Settings → Usage
- 🤖 AI-powered supplement analysis (optional)

## AI Features (Optional)

OptiStack includes optional AI-powered features for analyzing supplements and your full stack:

- **AI Chat Assistant**: Have a conversation with AI about your supplements. Ask about interactions, get recommendations for specific health goals (e.g., "what supplements help with athletic performance?"), and evaluate potential additions to your stack.
- **Supplement Analysis**: Get AI-generated summaries, recommended dosages, side effects, and optimal timing
- **Stack Analysis**: Analyze your entire supplement protocol for synergies, benefits, and potential interactions
- **Stack Optimizer**: Get proactive recommendations for missing cofactors and complementary supplements (e.g., K2 with D3, Copper with Zinc)

### Cloud AI (OpenRouter)

Use cloud-based AI models via [OpenRouter](https://openrouter.ai):

1. Get a free API key from [OpenRouter](https://openrouter.ai/keys)
2. Add it to your `.env` file: `OPENROUTER_API_KEY=sk-or-...`
3. Restart the container

### Local AI (Ollama) - Privacy-First Option

For complete privacy, OptiStack supports local AI via [Ollama](https://ollama.ai). All AI processing happens on your machine—no data leaves your network.

1. Install Ollama from https://ollama.ai
2. Pull a model: `ollama pull llama3.1:8b`
3. Set environment variables in `.env`:
   ```
   AI_PROVIDER=ollama
   OLLAMA_URL=http://localhost:11434
   OLLAMA_MODEL=llama3.1:8b
   ```
4. Restart the container

**Recommended Ollama Models:**
- `llama3.1:8b` - Good balance of speed and quality
- `mistral:7b` - Fast responses
- `gemma2:9b` - Google's open model

> **Note:** When running OptiStack in Docker, use `OLLAMA_URL=http://host.docker.internal:11434` to connect to Ollama running on your host machine.

If no AI provider is configured, the AI sections are completely hidden from the UI.

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

# Acknowledgments

Mostly created using [Antigravity](https://github.com/google-deepmind/antigravity) with Gemini Pro.

## License

MIT
