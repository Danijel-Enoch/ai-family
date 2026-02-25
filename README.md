# AI Family - API Proxy

A Turbo monorepo for managing AI API proxies. Allow friends and family to share your AI API keys while you maintain control.

## Features

- **Multi-Provider Support**: OpenAI, Anthropic, MiniMax
- **Provider Config Management**: Add your real API keys once
- **Proxy Keys**: Create unlimited proxy keys for friends/family
- **Usage Tracking**: Monitor requests, tokens, and latency per key
- **Key Management**: Pause, resume, revoke, or delete keys
- **Admin Dashboard**: React-based UI for managing everything

## Tech Stack

- **Runtime**: Bun.js
- **Backend**: Elysia (HTTP framework)
- **Database**: Prisma + SQLite
- **Frontend**: React + Vite
- **Monorepo**: Turbo

## Quick Start

### Prerequisites

- Bun.js
- Docker (optional)

### Development

```bash
# Install dependencies
bun install

# Generate Prisma client
cd packages/database && bun run db:generate

# Push schema to database
cd packages/database && DATABASE_URL="file:./dev.db" bun run db:push

# Start API server (port 3000)
cd apps/api && bun run dev

# Start dashboard (port 5173)
cd apps/dashboard && bun run dev
```

### Docker

```bash
# Build and run
docker-compose up --build
```

## Usage

1. Go to http://localhost:5173
2. Login with default credentials:
   - Email: `admin@ai-family.com`
   - Password: `admin123`
3. **Add Provider**: Go to "Providers" → Add your OpenAI/Anthropic/MiniMax API key
4. **Create Proxy Keys**: Go to "Proxy Keys" → Create keys for friends/family
5. **Share**: Give proxy keys to users

## API Endpoints

### Proxy Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/proxy/openai/chat` | OpenAI Chat Completions |
| POST | `/proxy/anthropic/messages` | Anthropic Messages |
| POST | `/proxy/minimax/chat` | MiniMax Chat Completions |

**Usage:**
```bash
curl -X POST http://localhost:3000/proxy/anthropic/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: ak_your_proxy_key" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model":"claude-3-haiku-20240307","max_tokens":100,"messages":[{"role":"user","content":"Hi"}]}'
```

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/admin/configs` | List/Create provider configs |
| GET/POST | `/admin/keys` | List/Create proxy keys |
| PATCH/DELETE | `/admin/keys/:id` | Update/Delete proxy key |
| POST | `/admin/keys/:id/pause` | Pause a key |
| POST | `/admin/keys/:id/resume` | Resume a key |
| POST | `/admin/keys/:id/revoke` | Revoke a key |
| GET | `/admin/usage` | Get usage logs |
| GET | `/admin/stats` | Get statistics |

### Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Admin login |
| POST | `/auth/logout` | Admin logout |
| GET | `/auth/me` | Get current user |

## Environment Variables

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
ADMIN_EMAIL="admin@ai-family.com"
ADMIN_PASSWORD="admin123"
CORS_ORIGIN="http://localhost:5173"
```

## Project Structure

```
ai-family/
├── apps/
│   ├── api/           # Elysia backend
│   └── dashboard/    # React dashboard
├── packages/
│   ├── database/     # Prisma schema
│   └── shared/       # Shared types
├── docker-compose.yml
├── Dockerfile
└── turbo.json
```

## License

MIT
