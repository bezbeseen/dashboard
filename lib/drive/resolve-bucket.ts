import { BoardStatus, type Job } from '@prisma/client';

export type DriveBucket = 'ACTIVE' | 'COMPLETED' | 'ARCHIVE';

/**
 * Maps ticket state to a top-level shared-drive folder:
 * - Archive: job is off the board (`archivedAt`).
 * - Completed: delivered or paid on the board.
 * - Active: everything else.
 */
export function driveBucketForJob(job: Pick<Job, 'archivedAt' | 'boardStatus'>): DriveBucket {
  if (job.archivedAt != null) return 'ARCHIVE';
  if (job.boardStatus === BoardStatus.DELIVERED || job.boardStatus === BoardStatus.PAID) {
    return 'COMPLETED';
  }
  return 'ACTIVE';
}
