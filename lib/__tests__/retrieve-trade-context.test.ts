import { describe, it, expect } from "vitest";
import { retrieveTradeContext, formatTradeContextForPrompt } from "../retrieve-trade-context";

describe("retrieveTradeContext", () => {
  it("retrieves the electrical category for an electrical-heavy document", () => {
    const text = "Supply and install switchboard, rewire power circuits, RCD safety switch";
    const result = retrieveTradeContext(text);

    expect(result.map((c) => c.id)).toContain("electrical");
  });

  it("retrieves multiple categories for a mixed-trade document", () => {
    const text = "Electrical rewire of kitchen, plumbing fixture replacement, cabinetry installation";
    const result = retrieveTradeContext(text);

    const ids = result.map((c) => c.id);
    expect(ids).toContain("electrical");
    expect(ids).toContain("plumbing");
    expect(ids).toContain("carpentry");
  });

  it("always includes the general fallback category", () => {
    const text = "Nothing in here matches a specific trade at all";
    const result = retrieveTradeContext(text);

    expect(result.map((c) => c.id)).toContain("general");
  });

  it("does not retrieve unrelated categories for a single-trade document", () => {
    const text = "Supply and install hot water system, bathroom fixtures, drainage pipe connection";
    const result = retrieveTradeContext(text);

    const ids = result.map((c) => c.id);
    expect(ids).not.toContain("roofing");
    expect(ids).not.toContain("earthworks");
  });
});

describe("formatTradeContextForPrompt", () => {
  it("includes the label, definition and keywords for each category", () => {
    const categories = retrieveTradeContext("switchboard rewire power");
    const formatted = formatTradeContextForPrompt(categories);

    expect(formatted).toContain("Electrical");
    expect(formatted).toMatch(/Keywords:/);
  });
});
