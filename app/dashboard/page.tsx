import { BoardStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { JobCard } from '@/components/job-card';

type DashboardPageProps = {
  searchParams: Promise<{ synced?: string; sync_error?: string; qb_connected?: string }>;
};

const columns: BoardStatus[] = [
  'REQUESTED',
  'QUOTED',
  'APPROVED',
  'PRODUCTION',
  'READY',
  'INVOICED',
  'DELIVERED',
  'PAID',
];

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const jobs = await prisma.job.findMany({ orderBy: { updatedAt: 'desc' } });
  const q = await searchParams;
  const qbConnected = q.qb_connected === '1';
  const synced = q.synced === '1';
  const syncError = q.sync_error ? decodeURIComponent(q.sync_error) : null;

  return (
    <main className="dashboard-main">
      {syncError ? (
        <div className="meta" style={{ color: 'crimson', marginBottom: '0.75rem' }}>
          QuickBooks sync error: {syncError}
        </div>
      ) : null}
      {qbConnected ? (
        <div className="meta" style={{ color: 'green', marginBottom: '0.75rem' }}>QuickBooks connected.</div>
      ) : null}
      {synced ? (
        <div className="meta" style={{ color: 'green', marginBottom: '0.75rem' }}>Synced latest estimates/invoices from QuickBooks.</div>
      ) : null}
      <div className="header">
        <div>
          <h1 style={{ margin: 0 }}>Dash</h1>
          <div className="meta">QuickBooks-backed production board — status moves with your shop</div>
        </div>
        <div className="top-actions">
          <a className="btn" href="/api/integrations/quickbooks/connect">
            Connect QuickBooks
          </a>
          <form action="/api/jobs/sync" method="post">
            <button className="btn" type="submit">Sync from QuickBooks</button>
          </form>
          <form action="/api/jobs/sync/demo" method="post">
            <button className="btn" type="submit" title="Adds fake cards for UI testing only">
              Demo data only
            </button>
          </form>
        </div>
      </div>
      <div className="board">
        {columns.map((column) => (
          <section className="column" key={column}>
            <h2>{column.replaceAll('_', ' ')}</h2>
            {jobs.filter((job) => job.boardStatus === column).map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
