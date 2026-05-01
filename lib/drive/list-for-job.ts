import { prisma } from '@/lib/db/prisma';
import { listDriveFolderChildren, type DriveFolderListItem } from '@/lib/drive/api';
import { getGmailOAuth2ClientForConnection, getGmailOAuth2ClientForApi } from '@/lib/gmail/tokens-db';

export async function listJobDriveFolderPreview(jobId: string): Promise<{
  items: DriveFolderListItem[];
  listError: string | null;
}> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { googleDriveFolderId: true, gmailConnectionId: true },
  });
  if (!job?.googleDriveFolderId) {
    return { items: [], listError: null };
  }
  try {
    const auth = job.gmailConnectionId
      ? await getGmailOAuth2ClientForConnection(job.gmailConnectionId)
      : await getGmailOAuth2ClientForApi();
    const items = await listDriveFolderChildren(auth, job.googleDriveFolderId, 40);
    return { items, listError: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { items: [], listError: msg };
  }
}
