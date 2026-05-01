import type { DriveBucket } from '@/lib/drive/resolve-bucket';

export function driveParentIdForBucket(bucket: DriveBucket): string | null {
  const v =
    bucket === 'ACTIVE'
      ? process.env.GOOGLE_DRIVE_ACTIVE_FOLDER_ID
      : bucket === 'COMPLETED'
        ? process.env.GOOGLE_DRIVE_COMPLETED_FOLDER_ID
        : process.env.GOOGLE_DRIVE_ARCHIVE_FOLDER_ID;
  const t = v?.trim();
  return t || null;
}

export function isGoogleDriveBucketSyncConfigured(): boolean {
  return Boolean(
    driveParentIdForBucket('ACTIVE') &&
      driveParentIdForBucket('COMPLETED') &&
      driveParentIdForBucket('ARCHIVE'),
  );
}
