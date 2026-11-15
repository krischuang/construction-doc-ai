import Anthropic from "@anthropic-ai/sdk";
import { EXTRACTION_TOOL, type ExtractedDocumentData, type LineItem } from "./extraction-schema";
import { retrieveTradeContext, formatTradeContextForPrompt, matchesWholeWord } from "./retrieve-trade-context";

export type ExtractionTransport = {
  extract(documentText: string): Promise<ExtractedDocumentData>;
};

/**
 * Deterministic mock transport. Parses the fixed, pipe-delimited line item
 * format used by every sample document in /samples (see one of those files
 * for the exact layout), then assigns a trade category using the same
 * retrieval step the live transport would feed to Claude. This is a real
 * rule-based extractor, not a hardcoded answer lookup, so it genuinely
 * fails on documents that do not follow the template, the same way a model
 * prompt tuned for one document shape would need adjustment for another.
 *
 * Used by default (see createTransport below) so the app, tests, and
 * evaluation suite all run with zero external dependencies and no API key.
 */
export class MockTransport implements ExtractionTransport {
  async extract(documentText: string): Promise<ExtractedDocumentData> {
    const vendorMatch = documentText.match(/Vendor:\s*(.+)/);
    const numberMatch = documentText.match(/(?:Invoice|Tender|Quote) Number:\s*(.+)/);
    const dateMatch = documentText.match(/Date:\s*(.+)/);
    const subtotalMatch = documentText.match(/Subtotal:\s*\$?([\d,.]+)/);
    const taxMatch = documentText.match(/(?:GST|Tax)[^:]*:\s*\$?([\d,.]+)/);
    // Anchored to the start of the line: the document-level total line
    // reads "Total: $X" with nothing before it, whereas each line item's
    // own "Total: $X" is preceded by "Unit Price: $Y | " on the same line.
    // An end-of-line anchor instead of start-of-line would match the first
    // line item's total, since that also sits at the end of its own line.
    const totalMatch = documentText.match(/^Total:\s*\$?([\d,.]+)/m);

    const lineItemPattern =
      /^\d+\.\s*(.+?)\s*\|\s*Qty:\s*([\d.]+)\s*\|\s*Unit:\s*(.+?)\s*\|\s*Unit Price:\s*\$?([\d,.]+)\s*\|\s*Total:\s*\$?([\d,.]+)/gm;

    const tradeContext = retrieveTradeContext(documentText);

    const lineItems: LineItem[] = [];
    let match: RegExpExecArray | null;
    while ((match = lineItemPattern.exec(documentText)) !== null) {
      const [, description, quantity, unit, unitPrice, lineTotal] = match;
      lineItems.push({
        description: description.trim(),
        quantity: parseFloat(quantity),
        unit: unit.trim(),
        unitPrice: parseFloat(unitPrice.replace(/,/g, "")),
        lineTotal: parseFloat(lineTotal.replace(/,/g, "")),
        tradeCategory: assignTradeCategory(description, tradeContext.map((c) => c.id)),
      });
    }

    return {
      vendorName: vendorMatch?.[1]?.trim() ?? "Unknown vendor",
      documentNumber: numberMatch?.[1]?.trim() ?? "Unknown",
      documentDate: dateMatch?.[1]?.trim() ?? "Unknown",
      lineItems,
      subtotal: parseFloat((subtotalMatch?.[1] ?? "0").replace(/,/g, "")),
      tax: parseFloat((taxMatch?.[1] ?? "0").replace(/,/g, "")),
      grandTotal: parseFloat((totalMatch?.[1] ?? "0").replace(/,/g, "")),
    };
  }
}

/** Keyword match against the retrieved, already-narrowed category list. */
function assignTradeCategory(description: string, candidateIds: string[]): string {
  const lower = description.toLowerCase();
  for (const id of candidateIds) {
    const terms = TRADE_KEYWORD_HINTS[id] ?? [];
    if (terms.some((t) => matchesWholeWord(lower, t))) return id;
  }
  return candidateIds[candidateIds.length - 1] ?? "general";
}

// A trimmed-down lookup used only by the mock transport's per-line-item
// tie-break; the retrieval step above is what actually narrows the
// candidate set, this just picks among already-retrieved categories.
const TRADE_KEYWORD_HINTS: Record<string, string[]> = {
  electrical: ["electrical", "wiring", "switchboard", "cable", "power", "lighting", "rcd"],
  plumbing: ["plumbing", "pipe", "drain", "tap", "fixture", "hot water", "gas fit"],
  concrete: ["concrete", "slab", "footing", "formwork", "pour"],
  carpentry: ["timber", "framing", "joinery", "cabinet", "cabinetry", "cabinets", "door", "window"],
  roofing: ["roof", "gutter", "flashing", "tile", "sheeting"],
  hvac: ["air conditioning", "ventilation", "duct", "mechanical"],
  earthworks: ["excavation", "site cut", "grading", "compaction", "earthmoving"],
  steelwork: ["steel", "beam", "column", "fabrication", "reinforcement"],
  landscaping: ["landscap", "turf", "paving", "garden", "retaining wall"],
  general: [],
};

/**
 * Live transport. Calls the real Claude API with the extraction tool
 * defined in extraction-schema.ts, grounding the tradeCategory assignment
 * in the trade categories retrieved for this specific document.
 */
export class LiveClaudeTransport implements ExtractionTransport {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async extract(documentText: string): Promise<ExtractedDocumentData> {
    const tradeContext = retrieveTradeContext(documentText);
    const contextBlock = formatTradeContextForPrompt(tradeContext);

    const response = await this.client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      tools: [EXTRACTION_TOOL],
      tool_choice: { type: "tool", name: EXTRACTION_TOOL.name },
      messages: [
        {
          role: "user",
          content: [
            "Extract the structured fields from this construction document.",
            "",
            "Assign each line item's tradeCategory using ONLY the ids from this retrieved list:",
            contextBlock,
            "",
            "Document text:",
            documentText,
          ].join("\n"),
        },
      ],
    });

    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Claude did not return a tool_use block for record_extracted_document");
    }

    return toolUse.input as ExtractedDocumentData;
  }
}

/** Live transport if ANTHROPIC_API_KEY is set, mock transport otherwise. */
export function createTransport(): ExtractionTransport {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) return new LiveClaudeTransport(apiKey);
  return new MockTransport();
}
