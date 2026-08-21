# BloodLink

A working frontend prototype for an emergency blood donation coordination platform.
Connects verified hospitals with eligible donors: eligibility-first filtering,
explainable donor ranking, controlled alerting, and automated escalation when
nobody responds. **Not the final product name** — placeholder until decided.

> This is a UI/UX prototype. Requests, donors, and metrics are mock/synthetic
> data — there is no backend yet.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (design tokens in [`src/index.css`](src/index.css))
- React Router
- Framer Motion (micro-interactions)
- Lucide icons
- Plain React state/Context (no external state library)

## Run it

```bash
npm install
npm run dev      # start the dev server
npm run build    # typecheck + production build
npm run lint      # oxlint
```

## Structure

```
src/
  components/
    ui/        Design-system primitives (Button, Card, Badge, Modal, Toast, ...)
    layout/    Sidebar, TopBar, HospitalShell, MobileShell
    shared/    Cross-cutting pieces (e.g. ComingSoon placeholder)
  pages/
    hospital/  Hospital dashboard screens
    donor/     Donor mobile experience screens
  lib/         Utilities, navigation config, (future) mock data + types
```

## Status

Built in phases — see commit history for what's landed. Phase 1
(application shell + design system) is complete; hospital dashboard,
live emergency request flow, donor experience, escalation demo mode,
analytics, and privacy center are in progress.
