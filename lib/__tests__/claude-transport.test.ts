import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { MockTransport } from "../claude-transport";

const SAMPLES_DIR = join(__dirname, "..", "..", "samples");

function loadSample(name: string): string {
  return readFileSync(join(SAMPLES_DIR, name), "utf-8");
}

describe("MockTransport", () => {
  it("extracts vendor, document number, date and totals from an electrical invoice", async () => {
    const transport = new MockTransport();
    const result = await transport.extract(loadSample("electrical-subcontractor-invoice.txt"));

    expect(result.vendorName).toBe("Harbour City Electrical Pty Ltd");
    expect(result.documentNumber).toBe("INV-2026-0147");
    expect(result.documentDate).toBe("12 March 2026");
    expect(result.subtotal).toBe(4630);
    expect(result.tax).toBe(463);
    expect(result.grandTotal).toBe(5093);
  });

  it("extracts every line item with correct quantities and totals", async () => {
    const transport = new MockTransport();
    const result = await transport.extract(loadSample("electrical-subcontractor-invoice.txt"));

    expect(result.lineItems).toHaveLength(3);
    expect(result.lineItems[0]).toMatchObject({
      description: "Supply and install 3-phase switchboard",
      quantity: 1,
      unit: "each",
      unitPrice: 2400,
      lineTotal: 2400,
    });
    expect(result.lineItems[2]).toMatchObject({
      description: "RCD safety switch installation",
      quantity: 4,
      unitPrice: 95,
      lineTotal: 380,
    });
  });

  it("assigns a trade category to every line item using the retrieved context", async () => {
    const transport = new MockTransport();
    const result = await transport.extract(loadSample("electrical-subcontractor-invoice.txt"));

    for (const item of result.lineItems) {
      expect(item.tradeCategory).toBe("electrical");
    }
  });

  it("assigns different trade categories to a mixed-trade document's line items", async () => {
    const transport = new MockTransport();
    const result = await transport.extract(loadSample("mixed-renovation-tender.txt"));

    expect(result.lineItems[0].tradeCategory).toBe("electrical");
    expect(result.lineItems[1].tradeCategory).toBe("plumbing");
    expect(result.lineItems[2].tradeCategory).toBe("carpentry");
  });

  it("handles a tender document using the same parser as an invoice", async () => {
    const transport = new MockTransport();
    const result = await transport.extract(loadSample("concrete-supply-tender.txt"));

    expect(result.vendorName).toBe("Statewide Concrete Supply");
    expect(result.documentNumber).toBe("TND-2026-0088");
    expect(result.grandTotal).toBe(18067.5);
  });
});
