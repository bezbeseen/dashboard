import type { Prisma } from '@prisma/client';
import { tool } from 'ai';
import type { ToolSet } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';

/**
 * Server-side tools for the Dash assistant (Prisma reads only; no writes).
 */
export function createDashAssistantTools(viewerEmail: string): ToolSet {
  return {
    board_snapshot: tool({
      description:
        'Counts active (non-archived) jobs grouped by board column (quoted, production, paid, etc.). Use for pipeline overview.',
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await prisma.job.groupBy({
          by: ['boardStatus'],
          where: { archivedAt: null },
          _count: { id: true },
        });
        return {
          byColumn: rows.map((r) => ({ boardStatus: r.boardStatus, count: r._count.id })),
        };
      },
    }),

    quickbooks_connections: tool({
      description:
        'Lists QuickBooks companies connected to Dash (realm ids and last ticket sync time). No balances or transaction detail.',
      inputSchema: z.object({}),
      execute: async () => {
        const tokens = await prisma.quickBooksToken.findMany({
          select: { realmId: true, lastTicketSyncAt: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
        });
        return {
          companies: tokens.map((t) => ({
            realmId: t.realmId,
            lastTicketSyncAt: t.lastTicketSyncAt?.toISOString() ?? null,
            tokenUpdatedAt: t.updatedAt.toISOString(),
          })),
        };
      },
    }),

    search_active_jobs: tool({
      description:
        'Find active jobs whose customer name or project name contains a substring (case-insensitive). Returns ids for linking to tickets.',
      inputSchema: z.object({
        query: z.string().min(1).describe('Substring to match'),
        limit: z.number().int().min(1).max(25).optional(),
      }),
      execute: async ({ query, limit }) => {
        const take = Math.min(limit ?? 12, 25);
        const jobs = await prisma.job.findMany({
          where: {
            archivedAt: null,
            OR: [
              { customerName: { contains: query, mode: 'insensitive' } },
              { projectName: { contains: query, mode: 'insensitive' } },
            ],
          },
          take,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            customerName: true,
            projectName: true,
            boardStatus: true,
            invoiceStatus: true,
            estimateStatus: true,
          },
        });
        return {
          jobs: jobs.map((j) => ({
            ...j,
            ticketPath: `/dashboard/jobs/${j.id}`,
          })),
        };
      },
    }),

    list_open_todos: tool({
      description:
        'Lists open shop To-dos (not ticket Tasks). Scope: mine + unassigned by default, or all open for a manager view.',
      inputSchema: z.object({
        scope: z
          .enum(['mine_and_unassigned', 'all_open'])
          .optional()
          .describe('mine_and_unassigned (default) or all_open'),
      }),
      execute: async ({ scope }) => {
        const s = scope ?? 'mine_and_unassigned';
        const where: Prisma.TodoWhereInput =
          s === 'all_open'
            ? { status: 'OPEN' }
            : {
                status: 'OPEN',
                OR: [{ assigneeEmail: viewerEmail }, { assigneeEmail: null }],
              };

        const todos = await prisma.todo.findMany({
          where,
          orderBy: [{ dueAt: 'asc' }, { updatedAt: 'desc' }],
          take: 30,
          select: {
            id: true,
            title: true,
            notes: true,
            dueAt: true,
            assigneeEmail: true,
            createdByEmail: true,
          },
        });
        return {
          scope: s,
          todos: todos.map((t) => ({
            ...t,
            dueAt: t.dueAt?.toISOString() ?? null,
            dashboardPath: '/dashboard/todos',
          })),
        };
      },
    }),

    open_ticket_tasks_summary: tool({
      description: 'Counts open ticket-linked Tasks (per-job checklist items), shop-wide.',
      inputSchema: z.object({}),
      execute: async () => {
        const open = await prisma.task.count({ where: { status: 'OPEN' } });
        const done = await prisma.task.count({ where: { status: 'DONE' } });
        return { openTicketTasks: open, doneTicketTasks: done };
      },
    }),

    recent_active_jobs: tool({
      description: 'Most recently updated active jobs (snapshot only).',
      inputSchema: z.object({
        limit: z.number().int().min(1).max(20).optional(),
      }),
      execute: async ({ limit }) => {
        const take = Math.min(limit ?? 8, 20);
        const jobs = await prisma.job.findMany({
          where: { archivedAt: null },
          take,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            customerName: true,
            projectName: true,
            boardStatus: true,
            updatedAt: true,
          },
        });
        return {
          jobs: jobs.map((j) => ({
            ...j,
            updatedAt: j.updatedAt.toISOString(),
            ticketPath: `/dashboard/jobs/${j.id}`,
          })),
        };
      },
    }),
  };
}
