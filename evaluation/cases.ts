export type EvaluationCase = {
  name: string;
  file: string;
  expected: {
    vendorName: string;
    documentNumber: string;
    lineItemCount: number;
    grandTotal: number;
    validationPassed: boolean;
  };
};

// One case per sample document in /samples. Expected values were computed
// by hand when the sample documents were written, independently of the
// extraction code, so a passing score means the pipeline actually produced
// the right answer, not that the test was written to match whatever the
// code happened to output.
export const EVALUATION_CASES: EvaluationCase[] = [
  {
    name: "Electrical subcontractor invoice",
    file: "electrical-subcontractor-invoice.txt",
    expected: {
      vendorName: "Harbour City Electrical Pty Ltd",
      documentNumber: "INV-2026-0147",
      lineItemCount: 3,
      grandTotal: 5093.0,
      validationPassed: true,
    },
  },
  {
    name: "Concrete supply tender",
    file: "concrete-supply-tender.txt",
    expected: {
      vendorName: "Statewide Concrete Supply",
      documentNumber: "TND-2026-0088",
      lineItemCount: 3,
      grandTotal: 18067.5,
      validationPassed: true,
    },
  },
  {
    name: "Plumbing fixtures invoice",
    file: "plumbing-fixtures-invoice.txt",
    expected: {
      vendorName: "Western Suburbs Plumbing",
      documentNumber: "INV-2026-0392",
      lineItemCount: 3,
      grandTotal: 4246.0,
      validationPassed: true,
    },
  },
  {
    name: "Steel fabrication quote",
    file: "steel-fabrication-quote.txt",
    expected: {
      vendorName: "Ironbark Steel Fabrication",
      documentNumber: "QTE-2026-0211",
      lineItemCount: 3,
      grandTotal: 13134.0,
      validationPassed: true,
    },
  },
  {
    name: "Carpentry framing invoice",
    file: "carpentry-framing-invoice.txt",
    expected: {
      vendorName: "Blue Mountains Carpentry Co",
      documentNumber: "INV-2026-0455",
      lineItemCount: 3,
      grandTotal: 8481.0,
      validationPassed: true,
    },
  },
  {
    name: "Roofing replacement quote",
    file: "roofing-replacement-quote.txt",
    expected: {
      vendorName: "Southside Roofing Specialists",
      documentNumber: "QTE-2026-0327",
      lineItemCount: 3,
      grandTotal: 12430.0,
      validationPassed: true,
    },
  },
  {
    name: "HVAC installation invoice",
    file: "hvac-installation-invoice.txt",
    expected: {
      vendorName: "Climate Control Mechanical Services",
      documentNumber: "INV-2026-0518",
      lineItemCount: 3,
      grandTotal: 12705.0,
      validationPassed: true,
    },
  },
  {
    name: "Earthworks excavation tender",
    file: "earthworks-excavation-tender.txt",
    expected: {
      vendorName: "Hunter Valley Earthmoving",
      documentNumber: "TND-2026-0163",
      lineItemCount: 3,
      grandTotal: 14465.0,
      validationPassed: true,
    },
  },
  {
    // Deliberately has a subtotal that does not match the sum of its line
    // items, to prove the validation guardrail actually catches a real
    // inconsistency rather than always passing.
    name: "Landscaping invoice with a subtotal error",
    file: "landscaping-invoice-with-error.txt",
    expected: {
      vendorName: "Coastal Landscaping Group",
      documentNumber: "INV-2026-0601",
      lineItemCount: 3,
      grandTotal: 8827.5,
      validationPassed: false,
    },
  },
  {
    name: "Mixed-trade renovation tender",
    file: "mixed-renovation-tender.txt",
    expected: {
      vendorName: "North Shore Renovations",
      documentNumber: "TND-2026-0229",
      lineItemCount: 3,
      grandTotal: 7348.0,
      validationPassed: true,
    },
  },
];
