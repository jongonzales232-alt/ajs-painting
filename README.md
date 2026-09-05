# AJ's Painting Website

Full-stack Next.js app for a small painting business. It includes a public marketing site, quote requests with photo uploads, estimate scheduling, admin login, lead management, gallery management, availability controls, email notifications, and `.ics` calendar invite generation.

## Tech Stack

- Next.js App Router
- React
- Prisma ORM
- SQLite for local/dev database; use hosted Postgres for production
- Resend-compatible email notifications
- Public gallery storage under `public/uploads`; private quote photos under `storage/uploads`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Edit `.env`:

- Change `ADMIN_PASSWORD`
- Change `SESSION_SECRET`
- Set `BUSINESS_OWNER_EMAIL`
- Set `BUSINESS_PHONE`, `BUSINESS_EMAIL`, `SERVICE_AREA`, and `BUSINESS_TIME_ZONE`
- Add `RESEND_API_KEY` and `EMAIL_FROM` when ready to send real emails

4. Create and seed the local SQLite database:

```bash
npm run db:setup
```

5. Start development:

```bash
npm run dev
```

6. Open:

- Public site: `http://localhost:3000`
- Admin dashboard: `http://localhost:3000/admin`
- Default local admin password in the included `.env`: see `ADMIN_PASSWORD`

Change that password before real use.

## Useful Commands

```bash
npm run build
npm run lint
npm run preflight:launch
npm run clean:test-data
npm run start
npm run db:setup
npm audit --audit-level=moderate
```

## Environment Variables

See `.env.example` for all supported values.

Email behavior:

- If `RESEND_API_KEY` is set, quote and scheduling notifications are sent through Resend.
- If `RESEND_API_KEY` is empty, the app logs email payloads in development so form flows still work.

## Admin Features

- View quote requests and uploaded lead photos
- Search leads by name, phone, address, project type, or status
- Change lead status: New, Contacted, Scheduled, Quoted, Won, Lost, Completed
- Add/update admin notes
- View scheduled estimate appointments
- Upload and delete gallery photos
- Add weekly appointment time slots
- Block unavailable days
- See dashboard stats for new leads, upcoming appointments, quoted jobs, and won jobs

## Calendar Invites

Every scheduled estimate generates an `.ics` calendar invite attachment for the owner and customer email. Full Apple Calendar or CalDAV syncing is intentionally left for a later integration; the scheduling code keeps appointment records structured so that can be added later.

## File Uploads

Quote photos: customers can select up to 20 JPG, PNG, WebP, or GIF images (25 MB each before preparation), including multiple selection batches. The browser re-encodes them as JPEG, at most 2000 pixels on the longest edge and 750 KB each, before upload. HEIC/HEIF files need to be exported as JPG first. Photos stay in private storage and are attached to the owner notification; the customer confirmation includes the complete project summary and photo count.

Quote emails include contact information, address, project type/area/size, preferred start date, complete description (up to 10,000 characters), consent, photo count, and quote reference. Admin quote rows display the preferred date and protected photo links. Failed email notifications are noted in the admin follow-up history and shown on the customer's saved-quote confirmation.

Run the quote regression checks without sending email or using the live database:

```bash
node --experimental-vm-modules scripts/test-quote.mjs
```

Gallery images are stored locally under `public/uploads` and are public. Customer quote photos are stored locally under `storage/uploads` and are only served through protected admin routes.

For production, replace both local upload locations with durable object storage such as S3, Cloudflare R2, or Vercel Blob before deploying at scale.

## Launch Checklist

Run this before using the site publicly:

```bash
npm run lint
npm run build
npm audit --audit-level=moderate
npm run clean:test-data
npm run preflight:launch
```

For a durable launch, configure:

- Hosted database, preferably Postgres
- Durable image storage
- Verified Resend sender/domain and `RESEND_API_KEY`
- Final HTTPS `NEXT_PUBLIC_SITE_URL`
- Strong `ADMIN_PASSWORD` and `SESSION_SECRET`
- Real business phone, email, service area, owner email, and time zone

The current Cloudflare quick-tunnel URL is temporary and depends on this computer staying online.

## Notes

The app includes a local `prisma/setup-sqlite.js` helper because Prisma's `db push` can be environment-sensitive on Windows shells. The canonical schema remains in `prisma/schema.prisma`, and the SQL used for local setup is checked in at `prisma/migrations/0001_init/migration.sql`.
