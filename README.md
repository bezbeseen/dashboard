# Dash

Minimal QuickBooks-backed operations board for production workflow.

Repo: [github.com/bezbeseen/dash](https://github.com/bezbeseen/dash)

## What it does

- Creates local jobs from QuickBooks estimate/invoice sync events
- Derives board columns automatically from QuickBooks plus internal production actions
- Lets staff manually mark jobs as started, ready, or delivered
- Moves a job to Paid when the synced invoice is fully paid

## Board logic

- Requested: no usable estimate yet
- Quoted: estimate exists and is not accepted
- Approved: estimate accepted but work not started
- Production: work started
- Ready: job marked ready
- Invoiced: QB invoice created, but not paid yet
- Delivered: job delivered (payment may still be open)
- Paid: invoice paid in QuickBooks

## Run locally

1. Copy `.env.example` to `.env`
2. Install packages
3. Run Prisma migrate
4. Seed demo data
5. Start Next.js

```bash
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```

## Connect QuickBooks (real API, local)

Skip the OAuth Playground redirect pain: use your app’s own callback.

1. In Intuit Developer → your app → **Settings → Redirect URIs** → **Development**, add **exactly**:

   `http://localhost:3000/api/integrations/quickbooks/callback`

   (Development allows HTTP.) Click **Save**.

2. Set in `.env`:

   - `QUICKBOOKS_CLIENT_ID` / `QUICKBOOKS_CLIENT_SECRET` (Development keys)
   - `QUICKBOOKS_REDIRECT_URI=http://localhost:3000/api/integrations/quickbooks/callback`
   - `QUICKBOOKS_ENVIRONMENT=sandbox` (until you use production API + tokens)

3. Run `npm run dev`, open `/dashboard`, click **Connect QuickBooks**, sign in to the **sandbox** company, approve. Tokens are stored in SQLite (`QuickBooksToken`).

4. After that, webhook sync calls use **real** `fetchEstimateById` / `fetchInvoiceById` against QuickBooks for that `realmId`.

5. On `/dashboard`, use **Sync from QuickBooks** to pull recent Estimates + Invoices via the Query API (good for local dev when webhooks can’t hit `localhost`). **Demo data only** is optional fake cards from before.

If you still see old fake names (Acme Auto, etc.), those are from `npm run seed` or **Demo data only** — you can clear `Job` rows in Prisma Studio or ignore them.

## Important files

- `prisma/schema.prisma` - core MVP schema
- `lib/domain/derive-board-status.ts` - self-moving board rules
- `lib/domain/sync.ts` - upsert and status update logic
- `app/api/integrations/quickbooks/webhook/route.ts` - webhook receiver
- `app/dashboard/page.tsx` - board UI

## Next steps

- Verify webhook signature in production
- Tighten invoice-to-estimate linking from QuickBooks data as you scale
- Add job detail page and activity timeline
- Auth / multi-user when you leave single-shop local dev
