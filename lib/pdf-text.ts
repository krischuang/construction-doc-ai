// Extracts the text layer from a PDF. This reads embedded text only, the
// same way a digitally-produced invoice PDF would already contain
// selectable text; it does not perform image OCR on scanned documents.
// Scanned drawings and site photos would need a vision-capable OCR step
// instead, which is a reasonable next extension but out of scope here, see
// the README for the explicit scope boundary.
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const result = await pdfParse(buffer);
  return result.text;
}
