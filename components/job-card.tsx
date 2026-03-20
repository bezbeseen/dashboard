import { Job } from '@prisma/client';

export function JobCard({ job }: { job: Job }) {
  return (
    <div className="card">
      <div>
        <strong>{job.projectName}</strong>
      </div>
      <div>{job.customerName}</div>
      <div className="meta">Estimate: ${(job.estimateAmountCents / 100).toFixed(2)}</div>
      <div className="meta">Invoice paid: ${(job.amountPaidCents / 100).toFixed(2)} / ${(job.invoiceAmountCents / 100).toFixed(2)}</div>
      <div className="badge">{job.boardStatus.replaceAll('_', ' ')}</div>
      <div className="actions">
        <form action={`/api/jobs/${job.id}/start`} method="post">
          <button className="btn" type="submit">Start Work</button>
        </form>
        <form action={`/api/jobs/${job.id}/ready`} method="post">
          <button className="btn" type="submit">Ready</button>
        </form>
        <form action={`/api/jobs/${job.id}/delivered`} method="post">
          <button className="btn" type="submit">Delivered</button>
        </form>
      </div>
    </div>
  );
}
