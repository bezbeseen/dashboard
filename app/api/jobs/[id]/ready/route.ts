import { NextResponse } from 'next/server';
import { ProductionStatus } from '@prisma/client';
import { updateProductionStatus } from '@/lib/domain/sync';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await updateProductionStatus(id, ProductionStatus.READY, 'job.ready', 'Job marked ready.');
  return NextResponse.redirect(new URL('/dashboard', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
}
