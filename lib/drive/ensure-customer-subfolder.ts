import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import { sanitizeDriveFileFolderName } from '@/lib/drive/job-folder-name';

const FOLDER_MIME = 'application/vnd.google-apps.folder';

/** Escape a string for use inside a Drive API `q` clause (single-quoted literal). */
function escapeDriveQueryLiteral(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Ensures a direct child folder of `parentId` exists with the given display name (sanitized).
 * Used for CLIENT JOBS / Active / *Customer* / *Job* hierarchy.
 */
export async function ensureFolderNamedUnderParent(
  auth: OAuth2Client,
  parentId: string,
  rawName: string,
): Promise<string> {
  let name = sanitizeDriveFileFolderName(rawName);
  if (!name) name = 'Customer';

  const drive = google.drive({ version: 'v3', auth });
  const esc = escapeDriveQueryLiteral(name);
  const q = `'${parentId}' in parents and trashed = false and mimeType = '${FOLDER_MIME}' and name = '${esc}'`;

  const res = await drive.files.list({
    q,
    pageSize: 15,
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const hit = res.data.files?.find((f) => f.id && f.name === name);
  if (hit?.id) return hit.id;

  const { data: created } = await drive.files.create({
    requestBody: {
      name,
      mimeType: FOLDER_MIME,
      parents: [parentId],
    },
    supportsAllDrives: true,
    fields: 'id',
  });
  return created.id!;
}
