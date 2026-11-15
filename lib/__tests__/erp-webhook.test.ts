import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendToErpWebhook } from "../erp-webhook";
import type { ExtractedDocumentData } from "../extraction-schema";
import type { ValidationResult } from "../validate-extraction";

const SAMPLE_DATA: ExtractedDocumentData = {
  vendorName: "Test Vendor",
  documentNumber: "INV-0001",
  documentDate: "1 January 2026",
  lineItems: [{ description: "Item A", quantity: 1, unit: "each", unitPrice: 100, lineTotal: 100, tradeCategory: "general" }],
  subtotal: 100,
  tax: 10,
  grandTotal: 110,
};

const PASSED: ValidationResult = { passed: true, issues: [] };
const FAILED: ValidationResult = { passed: false, issues: [{ field: "subtotal", message: "mismatch" }] };

describe("sendToErpWebhook", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("refuses to send a record that failed validation", async () => {
    await expect(sendToErpWebhook(SAMPLE_DATA, FAILED, "http://example.test/webhook")).rejects.toThrow(
      /Refusing to forward/,
    );
  });

  it("POSTs the formatted payload and returns the webhook response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ received: true }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const result = await sendToErpWebhook(SAMPLE_DATA, PASSED, "http://example.test/webhook", () => "2026-01-01T00:00:00.000Z");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://example.test/webhook",
      expect.objectContaining({ method: "POST" }),
    );
    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sentBody.documentNumber).toBe("INV-0001");
    expect(sentBody.sentAt).toBe("2026-01-01T00:00:00.000Z");
    expect(result).toEqual({ ok: true, status: 200, body: { received: true } });
  });
});
