import { BoardStatus, EstimateStatus, InvoiceStatus, ProductionStatus } from '@prisma/client';

type JobLike = {
  estimateStatus: EstimateStatus;
  productionStatus: ProductionStatus;
  invoiceStatus: InvoiceStatus;
  amountPaidCents?: number;
  invoiceAmountCents?: number;
};

export function deriveBoardStatus(job: JobLike): BoardStatus {
  const amountPaid = job.amountPaidCents ?? 0;
  const invoiceAmount = job.invoiceAmountCents ?? 0;

  if (job.invoiceStatus === InvoiceStatus.PAID || (invoiceAmount > 0 && amountPaid >= invoiceAmount)) {
    return BoardStatus.PAID;
  }

  if (job.productionStatus === ProductionStatus.DELIVERED) {
    return BoardStatus.DELIVERED;
  }

  // If the QB invoice exists but is not yet paid, the job should show as "Invoiced"
  // until production is delivered and/or the invoice is paid.
  if (job.invoiceStatus === InvoiceStatus.OPEN || job.invoiceStatus === InvoiceStatus.DRAFT) {
    return BoardStatus.INVOICED;
  }

  if (job.productionStatus === ProductionStatus.READY) {
    return BoardStatus.READY;
  }

  if (job.productionStatus === ProductionStatus.IN_PROGRESS) {
    return BoardStatus.PRODUCTION;
  }

  if (job.estimateStatus === EstimateStatus.ACCEPTED) {
    return BoardStatus.APPROVED;
  }

  if (job.estimateStatus === EstimateStatus.SENT || job.estimateStatus === EstimateStatus.DRAFT) {
    return BoardStatus.QUOTED;
  }

  return BoardStatus.REQUESTED;
}
