# Lens — Traefik Traffic Dashboard — Design Spec

**Date:** 2026-07-28
**Status:** Approved
**Based on:** hhftechnology/traefik-log-dashboard v3.1.1

## Overview

Professional Traefik log analytics dashboard with UniFi-inspired design system, geographic visualization, access logs, and remote service management. Forked from hhftechnology/traefik-log-dashboard with a complete frontend redesign and agent extensions.

## Architecture

Monorepo Turborepo structure:

```
Lens/
├── apps/
│   ├── dashboard/            # Next.js 15 App Router
│   └── agent/                # Go agent (forked + extended)
├── packages/
│   ├── shared/               # TypeScript types, API contracts
│   └── ui/                   # Design system (UniFi-inspired)
├── docs/
│   ├── memory/               # Context, decisions, notes
│   ├── tasks/                # Task tracking
│   └── plans/                # Specs and implementation plans
├── docker/
├── turbo.json
├── package.json
└── README.md
```

## Tech Stack

| Layer | Technology |
|---|---|
| Dashboard | Next.js 15, React 19, TypeScript, Tailwind CSS 3 |
| Design System | shadcn/ui rethemed + Radix UI + Phosphor Icons |
| Maps | Globe.GL (3D globe) + Leaflet (2D map) |
| Charts | Recharts |
| Agent | Go 1.22+, REST API, SQLite |
| IPC | REST + Bearer token auth |
| Font | Inter (Google Fonts, SIL Open Font License) |
| Deployment | Docker Compose, GHCR images |

## Design System (UniFi-Inspired)

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `background` | `#080C14` | Deep navy main background |
| `surface` | `#111827` | Cards, modals, sidebars |
| `surface-raised` | `#1A2332` | Hover states, dropdowns |
| `border` | `#1E2D3D` | Subtle borders |
| `primary` | `#0088CC` | Lens blue, buttons, links |
| `primary-glow` | `#00A3E0` | Active states, glow effects |
| `accent-teal` | `#00B4A0` | Success, OK statuses |
| `accent-orange` | `#F59E0B` | Warnings |
| `accent-red` | `#EF4444` | Errors, blocked items |
| `text-primary` | `#E8ECF1` | Primary text |
| `text-secondary` | `#7B8BA0` | Secondary text |
| `text-muted` | `#4B5A6E` | Muted text |

### Typography

- **Font:** Inter (300, 400, 500, 600)
- Headings in `font-light` for airy UniFi look
- Monospace for log entries and code

### Components

- Cards: `rounded-xl`, `surface` bg, 1px `border`
- Stat cards: Phosphor icon, large value, subtle label
- Tables: no zebra, thin border separators
- Badges: rounded pills, semi-transparent backgrounds
- Sidebar nav: Phosphor duotone icons, blue glow left border on active
- Signature: blue glow on active elements

### Responsive

- Desktop: sidebar nav, grid layouts
- Tablet: collapsible sidebar, stacked
- Mobile: bottom nav, stacked cards, tables → card lists, globe → map

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | Dashboard Overview | 3D globe, KPIs, top services, recent activity |
| `/analytics` | Analytics | 2D heatmap, charts by status/method/service |
| `/logs` | Access Logs | Live log table, advanced filters |
| `/services` | Services | Docker services, status, actions |
| `/firewall` | Firewall | IP/range/country block rules |
| `/agents` | Agents | Multi-agent management |
| `/alerts` | Alerts | Alert rules, thresholds |
| `/settings` | Settings | Preferences, tokens, theme |

## Agent API Extensions

```
POST /api/firewall/block       → Block IP/range/country
POST /api/firewall/unblock     → Unblock
GET  /api/firewall/list        → List blocked entries
GET  /api/services/list        → List Docker services + status
POST /api/services/restart     → Restart a service
POST /api/services/stop        → Stop a service
POST /api/services/start       → Start a service
```

## Data Flow

```
Traefik access logs
       ↓
   Agent Go (parse + GeoIP + metrics)
       ↓
   REST API (:5000)
       ↓
   Lens Dashboard Next.js (SWR cache)
       ↓
   Remote actions → Agent Go → Docker / Traefik
```
