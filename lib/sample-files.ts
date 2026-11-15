// Filenames under /samples that are safe to serve via the sampleFile
// request path in app/api/extract/route.ts. Kept as an explicit allowlist
// (rather than reading the directory) so a path cannot be injected through
// this parameter.
export const SAMPLE_FILES = [
  "electrical-subcontractor-invoice.txt",
  "concrete-supply-tender.txt",
  "plumbing-fixtures-invoice.txt",
  "steel-fabrication-quote.txt",
  "carpentry-framing-invoice.txt",
  "roofing-replacement-quote.txt",
  "hvac-installation-invoice.txt",
  "earthworks-excavation-tender.txt",
  "landscaping-invoice-with-error.txt",
  "mixed-renovation-tender.txt",
];

export function isSampleFile(name: string): boolean {
  return SAMPLE_FILES.includes(name);
}
