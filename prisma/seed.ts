import { PrismaClient, BoardStatus, EstimateStatus, InvoiceStatus, ProductionStatus, EventSource } from '@prisma/client';
import { deriveBoardStatus } from '../lib/domain/derive-board-status';

const prisma = new PrismaClient();

async function main() {
  await prisma.activityLog.deleteMany();
  await prisma.job.deleteMany();

  const jobs = [
    {
      customerName: 'Acme Auto',
      projectName: '500 Business Cards',
      estimateStatus: EstimateStatus.SENT,
      estimateAmountCents: 12000,
      invoiceStatus: InvoiceStatus.NONE,
      productionStatus: ProductionStatus.NOT_STARTED,
    },
    {
      customerName: 'Bay Event Co',
      projectName: 'Trade Show Banner',
      estimateStatus: EstimateStatus.ACCEPTED,
      estimateAcceptedAt: new Date(),
      estimateAmountCents: 32000,
      productionStatus: ProductionStatus.IN_PROGRESS,
      startedAt: new Date(),
      invoiceStatus: InvoiceStatus.NONE,
    },
    {
      customerName: 'Cedar Print Co',
      projectName: 'Lobby Wayfinding',
      estimateStatus: EstimateStatus.ACCEPTED,
      estimateAcceptedAt: new Date(),
      estimateAmountCents: 42000,
      productionStatus: ProductionStatus.READY,
      startedAt: new Date(),
      readyAt: new Date(),
      invoiceStatus: InvoiceStatus.OPEN,
      invoiceAmountCents: 42000,
      amountPaidCents: 0,
    },
    {
      customerName: 'Johns Plumbing',
      projectName: 'Truck Decals',
      estimateStatus: EstimateStatus.ACCEPTED,
      estimateAcceptedAt: new Date(),
      estimateAmountCents: 85000,
      productionStatus: ProductionStatus.DELIVERED,
      startedAt: new Date(),
      readyAt: new Date(),
      deliveredAt: new Date(),
      invoiceStatus: InvoiceStatus.OPEN,
      invoiceAmountCents: 85000,
      amountPaidCents: 0,
    },
    {
      customerName: 'Summit Dental',
      projectName: 'Lobby Sign',
      estimateStatus: EstimateStatus.ACCEPTED,
      estimateAcceptedAt: new Date(),
      estimateAmountCents: 145000,
      productionStatus: ProductionStatus.DELIVERED,
      startedAt: new Date(),
      readyAt: new Date(),
      deliveredAt: new Date(),
      invoiceStatus: InvoiceStatus.PAID,
      invoiceAmountCents: 145000,
      amountPaidCents: 145000,
      paidAt: new Date(),
    },
  ];

  for (const job of jobs) {
    const boardStatus = deriveBoardStatus(job);
    const created = await prisma.job.create({ data: { ...job, boardStatus } });
    await prisma.activityLog.create({
      data: {
        jobId: created.id,
        source: EventSource.SYSTEM,
        eventName: 'seed.created',
        message: 'Seed job created.',
      },
    });
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
