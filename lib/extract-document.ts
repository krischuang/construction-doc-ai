import { createTransport, type ExtractionTransport } from "./claude-transport";
import { validateExtraction, type ValidationResult } from "./validate-extraction";
import type { ExtractedDocumentData } from "./extraction-schema";

export type ProcessedDocument = {
  data: ExtractedDocumentData;
  validation: ValidationResult;
};

/**
 * Runs the full pipeline for one document: extract structured fields (via
 * the mock or live transport depending on whether ANTHROPIC_API_KEY is
 * set), then validate the result against the business-rule guardrails.
 * Does not forward to the ERP webhook; callers decide that separately so
 * extraction and validation stay testable without a network call.
 */
export async function processDocument(
  documentText: string,
  transport: ExtractionTransport = createTransport(),
): Promise<ProcessedDocument> {
  const data = await transport.extract(documentText);
  const validation = validateExtraction(data);
  return { data, validation };
}
