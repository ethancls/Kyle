# Kyle Architecture

## Stack

| Layer | Technology |
|---|---|
| Dashboard | Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 3 |
| Design System | shadcn/ui rethemed + Radix UI + Phosphor Icons |
| Agent | Go, REST API, SQLite, Docker socket |
| IPC | HTTP REST + Bearer token auth |
| Font | Inter (Google Fonts) |
| Deployment | Docker Compose, GHCR images |

## Monorepo Structure

```
Kyle/
├── apps/
│   ├── dashboard/            # Next.js 15 App Router (port 3000)
│   └── agent/                # Go agent (port 5000)
├── packages/
│   ├── shared/               # TypeScript types
│   └── ui/                   # cn() utility
└── docs/
    ├── memory/               # Architectural decisions
    ├── tasks/                # Task tracking
    └── plans/                # Design specs
```

## Data Flow

```
Traefik (:8080) → Agent Go (:5000) → Dashboard Next.js (:3000)
                                        ↓
                                   API Routes (/api/*)
                                        ↓
                                   Client Components
```

## Key Decisions

- **Everything through the agent**: dashboard never calls Traefik directly. Agent handles Traefik API + Docker socket.
- **Server Components by default**: pages are async server components. Only interactive UI uses `'use client'`.
- **No hardcoded fallbacks**: `AGENT_API_URL` and `AGENT_API_TOKEN` are required env vars, no defaults.
- **Design**: OLED black + white, UniFi blue accents, Phosphor icons duotone, Inter font.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `AGENT_API_URL` | Yes | Agent base URL (e.g. `http://localhost:5000`) |
| `AGENT_API_TOKEN` | Yes | Bearer token for agent auth |
