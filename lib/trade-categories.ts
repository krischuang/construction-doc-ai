// Local glossary of construction trade categories, used as the retrieval
// corpus for grounding line-item categorisation (see retrieveTradeContext).
// This is deliberately a small, inspectable dataset rather than a vector
// store, since the corpus is tiny and fixed: the point is to demonstrate a
// real retrieval step that an LLM call is grounded on, not to showcase a
// particular retrieval technology.

export type TradeCategory = {
  id: string;
  label: string;
  definition: string;
  keywords: string[];
};

export const TRADE_CATEGORIES: TradeCategory[] = [
  {
    id: "electrical",
    label: "Electrical",
    definition: "Wiring, switchboards, lighting, power points, cabling and electrical fit-out work.",
    keywords: ["electrical", "wiring", "switchboard", "cable", "conduit", "lighting", "power point", "rcd", "circuit"],
  },
  {
    id: "plumbing",
    label: "Plumbing",
    definition: "Water supply, drainage, gas fitting, fixtures and pipe installation.",
    keywords: ["plumbing", "pipe", "drain", "tap", "fixture", "gas fitting", "hot water", "sewer", "valve"],
  },
  {
    id: "concrete",
    label: "Concrete",
    definition: "Concrete supply, pouring, slabs, footings and formwork.",
    keywords: ["concrete", "slab", "footing", "formwork", "pour", "cement", "aggregate", "rebar"],
  },
  {
    id: "carpentry",
    label: "Carpentry",
    definition: "Framing, timber work, doors, windows, cabinetry and joinery.",
    keywords: ["carpentry", "timber", "framing", "joinery", "cabinet", "cabinetry", "cabinets", "door", "window frame", "stud"],
  },
  {
    id: "roofing",
    label: "Roofing",
    definition: "Roof sheeting, tiling, guttering, flashing and waterproofing at roof level.",
    keywords: ["roof", "roofing", "gutter", "flashing", "tile", "sheeting", "downpipe"],
  },
  {
    id: "hvac",
    label: "HVAC",
    definition: "Heating, ventilation, air conditioning and mechanical services.",
    keywords: ["hvac", "air conditioning", "ventilation", "ductwork", "mechanical services", "split system"],
  },
  {
    id: "earthworks",
    label: "Earthworks",
    definition: "Excavation, site cut, grading, compaction and bulk earthmoving.",
    keywords: ["earthworks", "excavation", "site cut", "grading", "compaction", "earthmoving", "trenching"],
  },
  {
    id: "steelwork",
    label: "Steelwork",
    definition: "Structural steel fabrication, beams, columns and reinforcement supply.",
    keywords: ["steel", "steelwork", "beam", "column", "fabrication", "reinforcement", "weld"],
  },
  {
    id: "landscaping",
    label: "Landscaping",
    definition: "Site landscaping, turfing, paving and outdoor finishing work.",
    keywords: ["landscaping", "turf", "paving", "garden", "retaining wall", "irrigation"],
  },
  {
    id: "general",
    label: "General",
    definition: "Site establishment, project management, general materials and anything not covered by a specific trade.",
    keywords: ["general", "site establishment", "project management", "consumables", "hire", "scaffold"],
  },
];
