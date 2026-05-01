import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { parseGoogleDriveFolderId } from '@/lib/drive/parse-folder-id';
import { postActionRedirect } from '@/lib/http/post-action-redirect';
import { syncJobDriveFolder } from '@/lib/drive/sync-job-folder';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const form = await req.formData();
  const raw = String(form.get('folderIdOrUrl') ?? '').trim();

  if (!raw) {
    await prisma.job.update({
      where: { id },
      data: {
        googleDriveFolderId: null,
        googleDriveSyncedAt: null,
        googleDriveLastError: null,
      },
    });
    return NextResponse.redirect(postActionRedirect(req, id, `/dashboard/jobs/${id}?drive_saved=1`));
  }

  const folderId = parseGoogleDriveFolderId(raw);
  if (!folderId) {
    return NextResponse.redirect(
      postActionRedirect(
        req,
        id,
        `/dashboard/jobs/${id}?drive_error=${encodeURIComponent('Invalid folder URL or ID.')}`,
      ),
    );
  }

  await prisma.job.update({
    where: { id },
    data: { googleDriveFolderId: folderId },
  });

  const result = await syncJobDriveFolder(id);
  if (!result.ok) {
    return NextResponse.redirect(
      postActionRedirect(req, id, `/dashboard/jobs/${id}?drive_error=${encodeURIComponent(result.error)}`),
    );
  }

  return NextResponse.redirect(postActionRedirect(req, id, `/dashboard/jobs/${id}?drive_saved=1`));
}
