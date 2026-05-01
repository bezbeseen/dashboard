import { NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText } from 'ai';
import { requireSessionEmail } from '@/lib/auth-session';
import { createDashAssistantTools } from '@/lib/assistant/dash-tools';

/** Vercel / Next -- extend `maxDuration` on Pro if tool-heavy replies run long. */
export const maxDuration = 60;

const SYSTEM = `You are "Dash Manager", an internal assistant for the Dash operations app (QuickBooks-backed shop board).

You help staff monitor the pipeline, todos, QuickBooks connection health, and ticket tasks. You only see what tools return -- never invent invoice numbers, dollar amounts, or customer names.

Capabilities:
- Summarize board columns, todos, ticket-task workload, and connected QuickBooks realms using tools.
- Suggest next actions (for example sync QuickBooks, check the To-dos page, open a ticket by path).
- Draft emails, checklists, or code snippets as text for humans to paste. You cannot run shell commands or edit the production codebase from here (no live execution on Vercel).

Limits:
- Read-only tools; you cannot change database rows or call write APIs.
- For Gmail or QuickBooks detail not exposed by tools, direct users to the relevant Dash screen.

Be concise. Use bullet lists for reports. When listing jobs, include ticket paths from tool output.`;

export async function POST(req: Request) {
  let viewerEmail: string;
  try {
    viewerEmail = await requireSessionEmail();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return NextResponse.json(
      {
        error:
          'OPENAI_API_KEY is not set. Add it in Vercel Environment Variables (and locally in .env) to use Dash Manager.',
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const messages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: 'Expected { messages: [...] }' }, { status: 400 });
  }

  const modelId = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';

  const tools = createDashAssistantTools(viewerEmail);
  const modelMessages = await convertToModelMessages(messages, { tools });

  const result = streamText({
    model: openai(modelId),
    system: `${SYSTEM}\n\nSigned-in user email: ${viewerEmail}`,
    messages: modelMessages,
    tools,
  });

  return result.toUIMessageStreamResponse();
}
