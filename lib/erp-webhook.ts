import type { ExtractedDocumentData } from "./extraction-schema";
import type { ValidationResult } from "./validate-extraction";

export type ErpWebhookPayload = {
  source: "construction-doc-ai";
  documentNumber: string;
  vendorName: string;
  documentDate: string;
  lineItems: ExtractedDocumentData["lineItems"];
  subtotal: number;
  tax: number;
  grandTotal: number;
  sentAt: string;
};

export type ErpWebhookResult = {
  ok: boolean;
  status: number;
  body: unknown;
};

/**
 * Only validated records are forwarded. Points at ERP_WEBHOOK_URL, which
 * defaults to the bundled mock receiver (app/api/mock-erp-webhook) so the
 * full flow runs end to end with no external ERP configured. A real
 * integration would point this at an actual ERP's ingest endpoint and
 * likely add authentication headers, which is the one piece this demo
 * intentionally leaves out since it has no real ERP to authenticate against.
 */
export async function sendToErpWebhook(
  data: ExtractedDocumentData,
  validation: ValidationResult,
  webhookUrl: string,
  now: () => string = () => new Date().toISOString(),
): Promise<ErpWebhookResult> {
  if (!validation.passed) {
    throw new Error("Refusing to forward a record that failed validation to the ERP webhook");
  }

  const payload: ErpWebhookPayload = {
    source: "construction-doc-ai",
    documentNumber: data.documentNumber,
    vendorName: data.vendorName,
    documentDate: data.documentDate,
    lineItems: data.lineItems,
    subtotal: data.subtotal,
    tax: data.tax,
    grandTotal: data.grandTotal,
    sentAt: now(),
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // non-JSON response, leave body as null
  }

  return { ok: res.ok, status: res.status, body };
}
