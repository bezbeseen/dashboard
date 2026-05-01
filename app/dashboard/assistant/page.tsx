import Link from 'next/link';
import { AssistantChat } from '@/components/assistant-chat';

export const dynamic = 'force-dynamic';

export default function AssistantPage() {
  return (
    <div className="board-page">
      <header className="board-topbar">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div>
            <h1 className="h4 mb-1">Dash Manager</h1>
            <p className="text-body-secondary small mb-0">
              AI assistant with live read-only views of your board, to-dos, and QuickBooks connection status.
            </p>
          </div>
          <Link href="/dashboard" className="btn btn-sm btn-outline-secondary">
            Back to board
          </Link>
        </div>
      </header>

      <div className="mt-3">
        <AssistantChat />
      </div>
    </div>
  );
}
