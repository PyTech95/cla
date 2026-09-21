# PRD — CLA Aesthetics & Wellness

## Original problem statement
User uploaded `cla-main (1).zip` and asked to "deploy here." Task = get the uploaded app running cleanly in this environment (React + FastAPI + MongoDB) so it is ready for one-click Deploy.

## Stack detection result
Already native Emergent stack — React 19 (CRA/craco) frontend, FastAPI backend (all routes under `/api`), MongoDB via motor. No rewrite/migration needed (plan Case 1: adapt in place).

## Architecture / work done (2026-09-21)
- Copied uploaded `backend/` (server.py, requirements.txt, tests) and `frontend/` (src, public, configs) into `/app`, preserving environment `.env` files.
- Installed backend deps (incl. emergentintegrations) and confirmed frontend deps present.
- Wired backend `.env`: added `JWT_SECRET` (generated), `ADMIN_EMAIL`, `ADMIN_PASSWORD` (generated), `EMERGENT_LLM_KEY` (for Emergent object storage). Kept MONGO_URL/DB_NAME/CORS_ORIGINS.
- Frontend uses `REACT_APP_BACKEND_URL` + `/api` (verified, no hardcoding).
- Restarted supervisor; verified: object storage init OK, admin seeded, `/api/content` returns data, admin login works via public URL, homepage renders.

## App features (existing)
Public site: hero, services, luxury treatments, gallery/portfolio, offers, team, testimonials, blog, contact/inquiry form, legal pages. Admin panel (`/admin`, JWT auth): dashboard analytics, CMS content editor, blog admin, offers, media uploads (object storage), inquiries/leads, SMTP settings (configured in-panel).

## Credentials
See `/app/memory/test_credentials.md`. Admin: admin@cla-aesthetics.com / JAiXcb4UuHxSYinW.

## Backlog / notes
- P1: SMTP for inquiry email notifications is disabled until configured in Admin → Settings → SMTP (Gmail app password).
- P2: Seed/sample CMS data loads by default; admin can reseed or edit.
- P2: Change default admin password after first login.

## Iteration 2 (2026-09-21) — Site appearance (white theme) toggle
- Added theme system: backend `GET /api/settings/appearance` (public) + `PUT /api/admin/settings/appearance` (admin), stored in `db.settings` key `appearance`.
- Admin → Settings → "Website appearance" card with Dark (black) / Light (white) buttons; applies instantly and persists.
- `index.css` `.theme-light` override layer remaps the dark palette (noir→white surfaces, bone→charcoal text, borders, fields, cards, gradient fades); photo overlays (`keep-dark`) keep dark fades so light captions stay readable.
- Theme currently set to **light (white)** per user request. Verified by testing agent (100% backend, core flows pass, persists across reloads).
