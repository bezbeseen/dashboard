import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';

export type DriveFolderListItem = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string | null;
};

function driveV3(auth: OAuth2Client) {
  return google.drive({ version: 'v3', auth });
}

export async function getDriveFolderParents(auth: OAuth2Client, folderId: string): Promise<string[]> {
  const drive = driveV3(auth);
  const res = await drive.files.get({
    fileId: folderId,
    fields: 'parents',
    supportsAllDrives: true,
  });
  return res.data.parents ?? [];
}

/**
 * Moves a Drive folder under `newParentId` (shared drive safe).
 */
export async function moveDriveItemToParent(
  auth: OAuth2Client,
  fileId: string,
  newParentId: string,
): Promise<void> {
  const parents = await getDriveFolderParents(auth, fileId);
  const removeParents = parents.join(',');
  const drive = driveV3(auth);
  await drive.files.update({
    fileId,
    addParents: newParentId,
    removeParents: removeParents || undefined,
    supportsAllDrives: true,
    fields: 'id, parents',
  });
}

export async function listDriveFolderChildren(
  auth: OAuth2Client,
  folderId: string,
  max = 40,
): Promise<DriveFolderListItem[]> {
  const drive = driveV3(auth);
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    pageSize: max,
    fields: 'files(id, name, mimeType, webViewLink)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    orderBy: 'folder desc, name_natural',
  });
  const files = res.data.files ?? [];
  return files.map((f) => ({
    id: f.id!,
    name: f.name ?? '(untitled)',
    mimeType: f.mimeType ?? 'application/octet-stream',
    webViewLink: f.webViewLink ?? null,
  }));
}

export function formatDriveUserError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/insufficient authentication scopes|accessNotConfigured|ACCESS_TOKEN_SCOPE_INSUFFICIENT/i.test(msg)) {
    return 'Google needs Drive permission; reconnect Gmail in Settings (includes Drive folder moves).';
  }
  if (/Forbidden|403/.test(msg)) {
    return 'Drive returned forbidden. Check shared drive membership and folder access for this Google account.';
  }
  if (/not found|404/i.test(msg)) {
    return 'Folder not found. Verify the folder ID still exists and is in a shared drive you can access.';
  }
  return msg.length > 200 ? `${msg.slice(0, 200)}...` : msg;
}
