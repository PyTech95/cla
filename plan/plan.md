# Plan: Get your uploaded project (`cla-main`) running and deployable here

## What you asked for
You uploaded `cla-main (1).zip` and asked to "deploy here." Deployment on this
platform is a button you press once the app is running correctly inside this
environment. So the real work is: take your uploaded code, get it running in this
environment cleanly, and hand it back ready for you to press Deploy.

## What this environment requires
Anything deployed here runs as a specific shape:
- A **React** frontend
- A **FastAPI (Python)** backend, with every backend route under `/api`
- **MongoDB** as the database

Your uploaded project may or may not already match this. That difference is the
main thing you need to weigh in on below.

## The decisions that are yours to make

**1. If your app is already React + FastAPI + MongoDB**
I adapt it in place: wire it to this environment's database and URLs, fix anything
that assumed a different host, and get it running. Low risk. Nothing to decide.

**2. If your app uses a different backend (Node/Express, Next.js API, Django, PHP, etc.)**
It cannot deploy here as-is. To make it deployable I would **rewrite the backend
in FastAPI**, keeping the same features and endpoints. This is a real amount of
work and the rewritten code will not be line-for-line your original.
- Accept the rewrite → app becomes deployable here.
- Decline → the app will not run/deploy in this environment, and you'd deploy it
  elsewhere instead.

**3. If your app uses a different database (Postgres/MySQL/SQLite/etc.)**
It must be **migrated to MongoDB** to deploy here. Your schema/tables get
remodeled as MongoDB collections. Query logic changes accordingly.
- Accept the migration → deployable here.
- Decline → not deployable in this environment.

**4. If your frontend is not React (Vue, Angular, plain HTML, etc.)**
The static site can likely still be served, but any framework-specific server
features would be reworked. If it's a non-React app framework, expect a port to
React for full support.

**5. External services and keys**
If the app talks to any third-party service (payments, login/auth, an AI model,
email/SMS, storage, an external API), those need to be reconnected here and I'll
need the relevant keys/credentials from you before that part works. Any keys baked
into the uploaded code will be treated as insecure and moved into environment
config. I'll list exactly what's needed once I can read the code.

**6. Existing data**
No data from wherever this app previously ran is carried over. It starts with an
empty database here. Seed/sample data can be added if you want the deployed app to
look populated.

## What I cannot confirm until you approve
Plan mode blocks me from unzipping and reading your code. So I don't yet know which
of the cases above (2/3/4) apply. Approving this plan lets me open the zip, detect
the real stack, and act on whichever branch matches — porting/migrating only where
required, and adapting in place where it already fits.

## What "done" looks like
- Your app builds and runs in this environment with no errors.
- Frontend and backend talk to each other correctly through the platform URL.
- Any external integrations are wired to environment config (pending your keys).
- Core user flows verified working.
- You get a ready-to-Deploy app plus a note of anything that still needs a key or
  a decision from you.

## Open question that could change the above
If you do **not** want your code rewritten/migrated to this environment's stack
(React + FastAPI + MongoDB), then "deploy here" isn't possible and the task instead
becomes a review of where else you could host it. Say so and I'll adjust.
