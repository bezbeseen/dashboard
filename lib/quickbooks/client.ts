import crypto from 'crypto';
import { getQuickBooksApiBase } from '@/lib/quickbooks/config';
import { getValidQuickBooksAccessToken } from '@/lib/quickbooks/tokens-db';
import { EstimateSnapshot, InvoiceSnapshot } from './types';

export function verifyQuickBooksSignature(rawBody: string, signatureHeader: string | null) {
  const verifierToken = process.env.QUICKBOOKS_WEBHOOK_VERIFIER;
  if (!verifierToken || !signatureHeader) return false;

  const digest = crypto.createHmac('sha256', verifierToken).update(rawBody).digest('base64');
  const expected = Buffer.from(digest);
  const actual = Buffer.from(signatureHeader);

  if (expected.length !== actual.length) return false;

  return crypto.timingSafeEqual(expected, actual);
}

function dollarsToCents(amt: string | number | undefined): number {
  if (amt == null) return 0;
  const n = typeof amt === 'number' ? amt : parseFloat(String(amt));
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

function mapEstimateTxnStatus(txnStatus?: string): EstimateSnapshot['status'] {
  switch ((txnStatus || '').toLowerCase()) {
    case 'pending':
      return 'SENT';
    case 'accepted':
    case 'closed':
      return 'ACCEPTED';
    case 'rejected':
      return 'REJECTED';
    default:
      return 'UNKNOWN';
  }
}

type QboRef = { value?: string; name?: string };

type QboEstimate = {
  Id?: string;
  TxnStatus?: string;
  TxnDate?: string;
  TotalAmt?: number | string;
  DocNumber?: string;
  CustomerRef?: QboRef;
};

type QboLinkedTxn = { TxnId?: string; TxnType?: string };

type QboInvoice = {
  Id?: string;
  TotalAmt?: number | string;
  Balance?: number | string;
  DocNumber?: string;
  CustomerRef?: QboRef;
  LinkedTxn?: QboLinkedTxn[];
};

async function qboJson(realmId: string, path: string): Promise<unknown> {
  const token = await getValidQuickBooksAccessToken(realmId);
  const base = getQuickBooksApiBase();
  const url = `${base}/v3/company/${encodeURIComponent(realmId)}/${path}${path.includes('?') ? '&' : '?'}minorversion=65`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`QuickBooks API ${res.status} for ${path}: ${text}`);
  }
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (parsed.Fault) {
      throw new Error(`QuickBooks Fault: ${JSON.stringify(parsed.Fault)}`);
    }
    return parsed;
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('QuickBooks Fault')) throw e;
    throw new Error(`QuickBooks API returned non-JSON for ${path}`);
  }
}

function estimateFromQbo(e: QboEstimate, fallbackId: string): EstimateSnapshot {
  const id = e.Id ?? fallbackId;
  const customerName = e.CustomerRef?.name?.trim() || `Customer ${e.CustomerRef?.value ?? 'unknown'}`;
  const projectName = e.DocNumber?.trim() ? `Estimate ${e.DocNumber}` : `Estimate ${id}`;

  return {
    id,
    customerId: e.CustomerRef?.value,
    customerName,
    projectName,
    totalAmtCents: dollarsToCents(e.TotalAmt),
    status: mapEstimateTxnStatus(e.TxnStatus),
    txnDate: e.TxnDate,
  };
}

function invoiceFromQbo(inv: QboInvoice, fallbackId: string): InvoiceSnapshot {
  const id = inv.Id ?? fallbackId;
  const totalCents = dollarsToCents(inv.TotalAmt);
  // Query responses may omit Balance; don't treat missing balance as "paid".
  const balanceKnown = inv.Balance != null && String(inv.Balance).length > 0;
  const balanceCents = balanceKnown ? dollarsToCents(inv.Balance) : 0;
  const amountPaidCents =
    balanceKnown && totalCents >= 0 ? Math.max(0, totalCents - balanceCents) : 0;

  let status: InvoiceSnapshot['status'] = 'OPEN';
  if (balanceKnown && balanceCents === 0 && totalCents > 0) {
    status = 'PAID';
  } else if (totalCents === 0 && (!balanceKnown || balanceCents === 0)) {
    status = 'DRAFT';
  }

  const linked = inv.LinkedTxn?.find(
    (t) => String(t.TxnType || '').toLowerCase() === 'estimate' && t.TxnId
  );
  const customerName = inv.CustomerRef?.name?.trim() || `Customer ${inv.CustomerRef?.value ?? 'unknown'}`;

  return {
    id,
    linkedEstimateId: linked?.TxnId,
    customerId: inv.CustomerRef?.value,
    customerName,
    totalAmtCents: totalCents,
    balanceCents,
    amountPaidCents,
    status,
  };
}

export async function fetchEstimateById(realmId: string, estimateId: string): Promise<EstimateSnapshot> {
  const body = await qboJson(realmId, `estimate/${encodeURIComponent(estimateId)}`);
  const est = (body as { Estimate?: QboEstimate }).Estimate;
  if (!est) {
    throw new Error('QuickBooks response missing Estimate object');
  }
  return estimateFromQbo(est, estimateId);
}

export async function fetchInvoiceById(realmId: string, invoiceId: string): Promise<InvoiceSnapshot> {
  const body = await qboJson(realmId, `invoice/${encodeURIComponent(invoiceId)}`);
  const inv = (body as { Invoice?: QboInvoice }).Invoice;
  if (!inv) {
    throw new Error('QuickBooks response missing Invoice object');
  }
  return invoiceFromQbo(inv, invoiceId);
}

function qboQueryEntities<T>(qr: { QueryResponse?: Record<string, unknown> } | undefined, key: string): T[] {
  const raw = qr?.QueryResponse?.[key];
  if (raw == null) return [];
  return Array.isArray(raw) ? (raw as T[]) : [raw as T];
}

/** Pull recent estimates from QuickBooks (sandbox or prod per env). */
export async function listRecentEstimates(realmId: string, maxResults = 50): Promise<EstimateSnapshot[]> {
  const sql = `SELECT * FROM Estimate MAXRESULTS ${maxResults}`;
  const body = await qboJson(realmId, `query?query=${encodeURIComponent(sql)}`);
  const estimates = qboQueryEntities<QboEstimate>(body as { QueryResponse?: Record<string, unknown> }, 'Estimate');
  return estimates.map((e) => estimateFromQbo(e, e.Id ?? ''));
}

/** Pull recent invoices from QuickBooks (balances / links may be sparser than GET-by-id). */
export async function listRecentInvoices(realmId: string, maxResults = 50): Promise<InvoiceSnapshot[]> {
  const sql = `SELECT * FROM Invoice MAXRESULTS ${maxResults}`;
  const body = await qboJson(realmId, `query?query=${encodeURIComponent(sql)}`);
  const invoices = qboQueryEntities<QboInvoice>(body as { QueryResponse?: Record<string, unknown> }, 'Invoice');
  return invoices.map((inv) => invoiceFromQbo(inv, inv.Id ?? ''));
}
