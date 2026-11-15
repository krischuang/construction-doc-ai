import { NextRequest, NextResponse } from "next/server";
import { sendToErpWebhook } from "@/lib/erp-webhook";
import { validateExtraction } from "@/lib/validate-extraction";
import type { ExtractedDocumentData } from "@/lib/extraction-schema";

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as ExtractedDocumentData;
    const validation = validateExtraction(data);

    if (!validation.passed) {
      return NextResponse.json(
        { error: "Record failed validation, refusing to forward to the ERP webhook", issues: validation.issues },
        { status: 422 },
      );
    }

    const webhookUrl = process.env.ERP_WEBHOOK_URL ?? "http://localhost:3000/api/mock-erp-webhook";
    const result = await sendToErpWebhook(data, validation, webhookUrl);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[send-to-erp] failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to send to ERP webhook" }, { status: 500 });
  }
}
