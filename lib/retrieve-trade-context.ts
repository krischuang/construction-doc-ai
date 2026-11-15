import { TRADE_CATEGORIES, type TradeCategory } from "./trade-categories";

/**
 * Retrieves the trade categories most relevant to a document, by scoring
 * keyword overlap between the document's raw text and each category's
 * keyword list. The top matches are returned as grounding context to be
 * injected into the Claude prompt, so the model assigns a tradeCategory per
 * line item from this retrieved list rather than inventing one from general
 * knowledge.
 *
 * This is a real retrieval step: given a corpus (TRADE_CATEGORIES) and a
 * query (the document text), it returns the subset judged most relevant.
 * Keyword overlap is used instead of embeddings because the corpus is small
 * and fixed, so a vector index would add complexity without changing the
 * result for this use case.
 */
export function retrieveTradeContext(documentText: string, topN = 3): TradeCategory[] {
  const normalised = documentText.toLowerCase();

  const scored = TRADE_CATEGORIES.map((category) => {
    const score = category.keywords.reduce((count, keyword) => {
      return count + (matchesWholeWord(normalised, keyword.toLowerCase()) ? 1 : 0);
    }, 0);
    return { category, score };
  });

  const ranked = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((s) => s.category);

  // Always include "general" as a fallback so the model has somewhere to
  // put a line item that genuinely does not match a specific trade.
  const general = TRADE_CATEGORIES.find((c) => c.id === "general")!;
  if (!ranked.some((c) => c.id === "general")) {
    ranked.push(general);
  }

  return ranked;
}

/**
 * Whole-word/phrase match, not a plain substring check. A plain
 * `.includes("cement")` check would false-positive on "replacement", since
 * "cement" is literally embedded inside that unrelated word. Keywords can
 * be multi-word phrases (e.g. "power point"), so the boundary is built
 * around the whole phrase rather than per character class shorthand.
 */
export function matchesWholeWord(text: string, phrase: string): boolean {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`).test(text);
}

/** Formats retrieved trade categories as prompt context for the Claude call. */
export function formatTradeContextForPrompt(categories: TradeCategory[]): string {
  return categories
    .map((c) => `- ${c.label} (id: ${c.id}): ${c.definition} Keywords: ${c.keywords.join(", ")}.`)
    .join("\n");
}
