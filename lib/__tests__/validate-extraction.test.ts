import { describe, it, expect } from "vitest";
import { validateExtraction } from "../validate-extraction";
import type { ExtractedDocumentData } from "../extraction-schema";

function validDocument(): ExtractedDocumentData {
  return {
    vendorName: "Test Vendor",
    documentNumber: "INV-0001",
    documentDate: "1 January 2026",
    lineItems: [
      { description: "Item A", quantity: 2, unit: "each", unitPrice: 100, lineTotal: 200, tradeCategory: "general" },
      { description: "Item B", quantity: 1, unit: "each", unitPrice: 50, lineTotal: 50, tradeCategory: "general" },
    ],
    subtotal: 250,
    tax: 25,
    grandTotal: 275,
  };
}

describe("validateExtraction", () => {
  it("passes a fully consistent document", () => {
    const result = validateExtraction(validDocument());
    expect(result.passed).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("fails when line items do not sum to the stated subtotal", () => {
    const data = validDocument();
    data.subtotal = 999;
    const result = validateExtraction(data);

    expect(result.passed).toBe(false);
    expect(result.issues.some((i) => i.field === "subtotal")).toBe(true);
  });

  it("fails when subtotal + tax does not equal the grand total", () => {
    const data = validDocument();
    data.grandTotal = 1000;
    const result = validateExtraction(data);

    expect(result.passed).toBe(false);
    expect(result.issues.some((i) => i.field === "grandTotal")).toBe(true);
  });

  it("fails when a line item's total does not equal quantity times unit price", () => {
    const data = validDocument();
    data.lineItems[0].lineTotal = 9999;
    const result = validateExtraction(data);

    expect(result.passed).toBe(false);
    expect(result.issues.some((i) => i.field === "lineItems[0].lineTotal")).toBe(true);
  });

  it("fails when there are no line items", () => {
    const data = validDocument();
    data.lineItems = [];
    const result = validateExtraction(data);

    expect(result.passed).toBe(false);
    expect(result.issues.some((i) => i.field === "lineItems")).toBe(true);
  });

  it("fails when vendorName is missing", () => {
    const data = validDocument();
    data.vendorName = "";
    const result = validateExtraction(data);

    expect(result.passed).toBe(false);
    expect(result.issues.some((i) => i.field === "vendorName")).toBe(true);
  });

  it("tolerates rounding differences of a cent or less", () => {
    const data = validDocument();
    data.subtotal = 250.004;
    const result = validateExtraction(data);
    expect(result.passed).toBe(true);
  });
});
