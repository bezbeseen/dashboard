import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import { getCustomerHubFolderId } from '@/lib/drive/config';
import { ensureFolderNamedUnderParent } from '@/lib/drive/ensure-customer-subfolder';

const SHORTCUT_MIME = 'application/vnd.google-apps.shortcut';

async function findShortcutToTargetInFolder(
  auth: OAuth2Client,
  parentId: string,
  targetFolderId: string,
): Promise<string | null> {
  const drive = google.drive({ version: 'v3', auth });
  let pageToken: string | undefined;
  do {
    const res = await drive.files.list({
      q: `'${parentId}' in parents and trashed = false and mimeType = '${SHORTCUT_MIME}'`,
      pageSize: 100,
      fields: 'nextPageToken, files(id, shortcutDetails)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageToken,
    });
    for (const f of res.data.files ?? []) {
      if (f.shortcutDetails?.targetId === targetFolderId && f.id) return f.id;
    }
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);
  return null;
}

/**
 * Ensures a Drive shortcut exists under Hub / Customer / (shortcut to job folder).
 * Canonical folders stay under Active|Completed|Archive; hub is for browsing all jobs by client.
 * Throws on failure; callers should catch and log so bucket moves still succeed.
 */
export async function syncCustomerHubShortcut(
  auth: OAuth2Client,
  customerName: string,
  jobFolderId: string,
): Promise<void> {
  const hubRoot = getCustomerHubFolderId();
  if (!hubRoot) return;

  const customerFolderId = await ensureFolderNamedUnderParent(auth, hubRoot, customerName);
  const drive = google.drive({ version: 'v3', auth });

  const meta = await drive.files.get({
    fileId: jobFolderId,
    fields: 'name',
    supportsAllDrives: true,
  });
  const targetName = meta.data.name ?? 'Job';

  let shortcutId = await findShortcutToTargetInFolder(auth, customerFolderId, jobFolderId);

  if (!shortcutId) {
    const { data: created } = await drive.files.create({
      requestBody: {
        name: targetName,
        mimeType: SHORTCUT_MIME,
        shortcutDetails: { targetId: jobFolderId },
        parents: [customerFolderId],
      },
      supportsAllDrives: true,
      fields: 'id',
    });
    shortcutId = created.id!;
  } else {
    const existing = await drive.files.get({
      fileId: shortcutId,
      fields: 'name',
      supportsAllDrives: true,
    });
    if (existing.data.name !== targetName) {
      await drive.files.update({
        fileId: shortcutId,
        requestBody: { name: targetName },
        supportsAllDrives: true,
      });
    }
  }
}
