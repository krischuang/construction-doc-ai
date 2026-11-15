import type { ExtractedDocumentData } from "./extraction-schema";

export type ValidationIssue = { field: string; message: string };

export type ValidationResult = {
  passed: boolean;
  issues: ValidationIssue[];
};

const ROUNDING_TOLERANCE = 0.01;

/**
 * Business-rule guardrails applied after extraction, before a record is
 * persisted or forwarded to the ERP webhook. These are the kind of checks
 * that stop a malformed or inconsistent record from silently reaching a
 * downstream system: the same shape of problem as validating invoice data
 * before it reaches an ERP, just applied here to AI-extracted output
 * instead of a legacy OCR pipeline's output.
 */
export function validateExtraction(data: ExtractedDocumentData): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!data.vendorName || data.vendorName.trim().length === 0) {
    issues.push({ field: "vendorName", message: "vendorName is required" });
  }
  if (!data.documentNumber || data.documentNumber.trim().length === 0) {
    issues.push({ field: "documentNumber", message: "documentNumber is required" });
  }
  if (!Array.isArray(data.lineItems) || data.lineItems.length === 0) {
    issues.push({ field: "lineItems", message: "at least one line item is required" });
  }

  for (const [index, item] of (data.lineItems ?? []).entries()) {
    const expectedLineTotal = roundTo2(item.quantity * item.unitPrice);
    if (Math.abs(expectedLineTotal - item.lineTotal) > ROUNDING_TOLERANCE) {
      issues.push({
        field: `lineItems[${index}].lineTotal`,
        message: `expected ${expectedLineTotal} (quantity * unitPrice) but got ${item.lineTotal}`,
      });
    }
  }

  const lineItemSum = roundTo2((data.lineItems ?? []).reduce((sum, item) => sum + item.lineTotal, 0));
  if (Math.abs(lineItemSum - data.subtotal) > ROUNDING_TOLERANCE) {
    issues.push({
      field: "subtotal",
      message: `line items sum to ${lineItemSum} but subtotal is ${data.subtotal}`,
    });
  }

  const expectedGrandTotal = roundTo2(data.subtotal + data.tax);
  if (Math.abs(expectedGrandTotal - data.grandTotal) > ROUNDING_TOLERANCE) {
    issues.push({
      field: "grandTotal",
      message: `subtotal + tax = ${expectedGrandTotal} but grandTotal is ${data.grandTotal}`,
    });
  }

  if (data.tax < 0 || data.subtotal < 0 || data.grandTotal < 0) {
    issues.push({ field: "amounts", message: "subtotal, tax, and grandTotal must not be negative" });
  }

  return { passed: issues.length === 0, issues };
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}
