import { NextRequest, NextResponse } from "next/server";

/**
 * Stands in for a real ERP's ingest endpoint. Accepts the same payload
 * shape lib/erp-webhook.ts sends, and returns a receipt. A real integration
 * would replace ERP_WEBHOOK_URL with an actual ERP's endpoint instead of
 * this route; this exists so the full extract-validate-forward flow is
 * demonstrable with nothing external configured.
 */
export async function POST(request: NextRequest) {
  const payload = await request.json();

  console.log(`[mock-erp-webhook] received document ${payload.documentNumber} from ${payload.vendorName}`);

  return NextResponse.json({
    received: true,
    documentNumber: payload.documentNumber,
    acknowledgedAt: new Date().toISOString(),
  });
}
