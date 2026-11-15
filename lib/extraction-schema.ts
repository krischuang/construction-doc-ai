// Shared types and the Claude tool-calling schema for structured extraction
// of construction documents (invoices, tenders, quotes).

export type LineItem = {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
  tradeCategory: string;
};

export type ExtractedDocumentData = {
  vendorName: string;
  documentNumber: string;
  documentDate: string;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  grandTotal: number;
};

// Anthropic tool definition. The model must return structured data matching
// this JSON schema rather than free text, which is what makes the result
// safe to parse and store without a second free-text-to-JSON pass.
export const EXTRACTION_TOOL = {
  name: "record_extracted_document",
  description:
    "Record the structured fields extracted from a construction invoice, tender, or quote.",
  input_schema: {
    type: "object" as const,
    properties: {
      vendorName: { type: "string", description: "The supplier or contractor issuing the document" },
      documentNumber: { type: "string", description: "Invoice, tender, or quote reference number" },
      documentDate: { type: "string", description: "Document date as written in the source text" },
      lineItems: {
        type: "array",
        items: {
          type: "object",
          properties: {
            description: { type: "string" },
            quantity: { type: "number" },
            unit: { type: "string", description: "e.g. m2, each, hours, linear metre" },
            unitPrice: { type: "number" },
            lineTotal: { type: "number" },
            tradeCategory: {
              type: "string",
              description:
                "Assigned using the retrieved trade category context provided in the prompt, not guessed from general knowledge",
            },
          },
          required: ["description", "quantity", "unit", "unitPrice", "lineTotal", "tradeCategory"],
        },
      },
      subtotal: { type: "number" },
      tax: { type: "number" },
      grandTotal: { type: "number" },
    },
    required: ["vendorName", "documentNumber", "documentDate", "lineItems", "subtotal", "tax", "grandTotal"],
  },
};
