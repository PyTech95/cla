# CLA Aesthetics & Wellness — PRD

## Overview
Luxury medical-aesthetics studio website (React CRA + craco, FastAPI, MongoDB).
Imported from user-provided zip `cla-spa30` and wired into the Emergent environment.
Public marketing site + AI concierge + client portal + admin CRM + Stripe membership checkout,
fully editable via an admin **Site Editor**.

## Stack / Integrations
- Frontend: React 19, CRA+craco, Tailwind, shadcn/ui, framer-motion. Env: REACT_APP_BACKEND_URL.
- Backend: FastAPI + Motor/MongoDB. JWT custom auth (access+refresh), admin seeded from env.
- Integrations: EMERGENT_LLM_KEY (Camille concierge chat via emergentintegrations, Claude sonnet-4-5;
  also powers object-storage uploads), STRIPE_API_KEY=sk_test_emergent (membership checkout),
  SMTP (runtime-configured in Admin > Settings, stored in Mongo).

## Implemented
- 2026-xx: App imported & running (fixed webpack-dev-server v5 / craco.config incompatibility).
- Public: hero, marquee, about, team, services, offers, gallery, news, testimonials, contact, footer, legal pages.
- Auth: register/login/refresh/logout/change-password, brute-force lockout. Admin CRM: leads, clients,
  revenue, payments, subscriptions, news, offers, CMS collections. Stripe membership checkout (test mode).
- Feature pass (user requests):
  - Hero facility "Step inside / The CLA Studio" image now shows on MOBILE (was desktop-only).
  - Hero facility overlay text + image editable via Site Editor (hero.facility_* keys, brand.hero_facility_image_url).
  - Gallery rebuilt: auto-scrolling marquee (left→right, finger-swipeable on mobile), "View gallery"
    button → full grid, click → lightbox. Supports IMAGES **and VIDEOS**.
  - Admin uploads now accept video (mp4/webm/mov/ogg up to 64MB) in addition to images (POST /api/admin/upload).
  - New **Team/Staff** section (GET /api/team, CMS kind "team": name/role/photo/bio) editable in Site Editor.
  - Contact **Hours** card now editable (content keys contact.hours "Label|Value" per line, contact.hours_title).
  - Sparkle/motion: animated gold sparkles + glow-pulse on hero headline and footer wordmark.
  - Concierge widget (Camille chat + lead form) mounted globally.
- Verified via testing_agent iteration_2: 39/39 backend tests pass; frontend flows confirmed desktop+mobile.

- 2026-09-18: Re-imported from `cla-main.zip` into this workspace. Backend `.env` configured
  (JWT_SECRET, ADMIN_EMAIL/PASSWORD, EMERGENT_LLM_KEY, STRIPE_API_KEY). Smoke-tested: home page renders,
  admin login works, object storage initialized, deployment_agent readiness check PASSED.

## Backlog / Next
- P1: Optional per-item poster image for gallery videos; drag-reorder gallery in editor.
- P2: Portal change-password UI (backend endpoint exists), real Stripe refund (currently mocked in admin).
- P2: Configure SMTP for booking/lead email notifications.
