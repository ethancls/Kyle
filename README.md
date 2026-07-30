# Lens — Traefik Traffic Dashboard

Professional real-time analytics platform for Traefik reverse proxy logs.

Built with Next.js 15, Go, and a UniFi-inspired design system.

## Getting Started

```bash
pnpm install
pnpm dev
```

## Structure

```
Lens/
├── apps/
│   ├── dashboard/    # Next.js 15 App Router
│   └── agent/        # Go agent (forked from hhftechnology)
├── packages/
│   ├── shared/       # TypeScript types, API contracts
│   └── ui/           # Design system
└── docs/
```
