# ThreatLens – Cybersecurity & Threat Intelligence Dashboard

A front-end only Angular application for monitoring threats, looking up Indicators of Compromise (IOCs) and managing security incidents. There is **no backend or database server**: the data lives in JSON files (`public/data/*.json`) and user changes are kept in the browser (`localStorage`).

## Features
- **Login & roles** – admin / analyst / viewer with route guards and role-based UI
- **Dashboard** – KPI cards, threat trend, type and country charts (Chart.js), severity breakdown, live alert feed simulation (RxJS `interval`)
- **Threat Feed** – debounced live search, filters, sorting, pagination, threat detail page, block IP
- **IOC Lookup** – validates and auto-detects IP / domain / URL / hash, risk-score gauge, lookup history
- **Incidents** – Kanban board with drag & drop, list view, create/edit forms, notes, assignment, delete; saved in `localStorage`
- **Reports** – summary statistics, CSV export (threats, incidents, IOCs), print / save as PDF
- **User Management** (admin only) – view users and change roles
- Dark / light theme, responsive layout, toast notifications, loading and empty states

## Tech Stack
Angular 22 (standalone components, signals, lazy-loaded routes, reactive forms) · TypeScript · HTML5 · SCSS · RxJS · Chart.js · Vitest (unit tests)

## Setup & Run
Requirements: Node.js 20+ and npm.

```bash
npm install
npm start            # runs ng serve → open http://localhost:4200
```

Other commands:
```bash
npm run build        # production build → dist/threat-intel-dashboard
npm test             # unit tests (Vitest)
node scripts/generate-data.mjs   # regenerate the sample JSON data
```

## Demo accounts
| Role | Username | Password | Access |
|---|---|---|---|
| Admin | `admin` | `admin123` | Everything + User Management |
| Analyst | `analyst` | `analyst123` | Manage threats and incidents |
| Viewer | `viewer` | `viewer123` | Read-only |

## Project Structure
```
src/app/
├── core/        models, services (auth, data, toast, theme), guards
├── shared/      reusable components (chart, badge, toast), pipes, utils
├── layout/      app shell (sidebar + top bar)
└── features/
    ├── dashboard/      Member 1
    ├── threat-feed/    Member 2 (feed, detail, IOC lookup)
    ├── incidents/      Member 3
    └── auth, reports, admin/   Member 4
public/data/     JSON "database" (threats, iocs, incidents, users)
docs/            architecture and design diagrams (Mermaid)
```

## Team Modules
| Member | Module | Main files |
|---|---|---|
| Member 1 | Dashboard, charts, app layout | `features/dashboard`, `shared/components/chart.component.ts`, `layout/` |
| Member 2 | Threat feed, threat details, IOC lookup | `features/threat-feed` |
| Member 3 | Incident management (Kanban, forms, notes) | `features/incidents` |
| Member 4 | Authentication, guards, reports, user admin | `features/auth`, `features/reports`, `features/admin`, `core/guards`, `core/services/auth.service.ts` |

> Fill in the real member names and roll numbers before submission.

## Notes
- Timestamps in the JSON files are stored as `minutesAgo` and converted to real dates when loaded, so the dashboard always looks current.
- Login is for demonstration only; passwords in JSON are not secure and must never be used this way in production.
