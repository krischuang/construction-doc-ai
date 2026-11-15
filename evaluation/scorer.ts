import { TRADE_CATEGORIES } from "../lib/trade-categories";
import type { ProcessedDocument } from "../lib/extract-document";
import type { EvaluationCase } from "./cases";

export type DimensionResult = { dimension: string; pass: boolean; detail: string };

export type CaseScore = {
  name: string;
  file: string;
  dimensions: DimensionResult[];
  allPassed: boolean;
};

const VALID_TRADE_IDS = new Set(TRADE_CATEGORIES.map((c) => c.id));
const AMOUNT_TOLERANCE = 0.01;

/**
 * Scores one processed document against its expected values across five
 * independent dimensions, mirroring the per-dimension scoring approach used
 * in the 43030-aws-serverless-genai evaluation suite: a single overall
 * pass/fail hides which part of the pipeline actually broke, so each
 * dimension is reported separately.
 */
export function scoreCase(evalCase: EvaluationCase, result: ProcessedDocument): CaseScore {
  const { expected } = evalCase;
  const { data, validation } = result;

  const dimensions: DimensionResult[] = [
    {
      dimension: "vendorName",
      pass: data.vendorName === expected.vendorName,
      detail: `expected "${expected.vendorName}", got "${data.vendorName}"`,
    },
    {
      dimension: "documentNumber",
      pass: data.documentNumber === expected.documentNumber,
      detail: `expected "${expected.documentNumber}", got "${data.documentNumber}"`,
    },
    {
      dimension: "lineItemCount",
      pass: data.lineItems.length === expected.lineItemCount,
      detail: `expected ${expected.lineItemCount}, got ${data.lineItems.length}`,
    },
    {
      dimension: "grandTotal",
      pass: Math.abs(data.grandTotal - expected.grandTotal) <= AMOUNT_TOLERANCE,
      detail: `expected ${expected.grandTotal}, got ${data.grandTotal}`,
    },
    {
      dimension: "tradeCategoryAssigned",
      pass: data.lineItems.length > 0 && data.lineItems.every((item) => VALID_TRADE_IDS.has(item.tradeCategory)),
      detail: `line item trade categories: ${data.lineItems.map((i) => i.tradeCategory).join(", ")}`,
    },
    {
      dimension: "validationPassed",
      pass: validation.passed === expected.validationPassed,
      detail: `expected validationPassed=${expected.validationPassed}, got ${validation.passed}${
        validation.issues.length ? `, issues: ${validation.issues.map((i) => i.message).join("; ")}` : ""
      }`,
    },
  ];

  return {
    name: evalCase.name,
    file: evalCase.file,
    dimensions,
    allPassed: dimensions.every((d) => d.pass),
  };
}
