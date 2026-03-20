export type QboEntityOperation = 'Create' | 'Update' | 'Delete' | string;

export type QboWebhookEntity = {
  name: string;
  id: string;
  operation: QboEntityOperation;
  lastUpdated?: string;
};

export type QboWebhookNotification = {
  realmId: string;
  dataChangeEvent?: {
    entities?: QboWebhookEntity[];
  };
};

export type QboWebhookPayload = {
  eventNotifications: QboWebhookNotification[];
};

export type EstimateSnapshot = {
  id: string;
  customerId?: string;
  customerName: string;
  projectName: string;
  totalAmtCents: number;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  txnDate?: string;
  acceptedAt?: string;
};

export type InvoiceSnapshot = {
  id: string;
  linkedEstimateId?: string;
  customerId?: string;
  customerName: string;
  totalAmtCents: number;
  balanceCents: number;
  amountPaidCents: number;
  status: 'DRAFT' | 'OPEN' | 'PAID' | 'VOID';
};
