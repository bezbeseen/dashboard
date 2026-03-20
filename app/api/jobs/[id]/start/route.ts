import { NextResponse } from 'next/server';
import { ProductionStatus } from '@prisma/client';
import { updateProductionStatus } from '@/lib/domain/sync';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await updateProductionStatus(id, ProductionStatus.IN_PROGRESS, 'job.started', 'Production started.');
  return NextResponse.redirect(new URL('/dashboard', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
}
