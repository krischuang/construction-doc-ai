export type FileValidationResult = { valid: boolean; error?: string };

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = new Set(["text/plain", "application/pdf"]);

/**
 * Checked before the uploaded file's contents are read into memory. Caps
 * both size and type: an uncapped upload endpoint that reads the full body
 * before validating is a real denial-of-service vector on a single-instance
 * deployment, the same class of gap that an earlier project in this
 * portfolio (a CSV import endpoint) had before a 5MB cap was added.
 */
export function validateUpload(file: { size: number; type: string; name: string }): FileValidationResult {
  if (file.size > MAX_UPLOAD_BYTES) {
    return { valid: false, error: `File exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB upload limit` };
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, error: `Unsupported file type: ${file.type}. Only .txt and .pdf are accepted.` };
  }
  if (!/\.(txt|pdf)$/i.test(file.name)) {
    return { valid: false, error: "File must have a .txt or .pdf extension" };
  }
  return { valid: true };
}

export { MAX_UPLOAD_BYTES, ALLOWED_MIME_TYPES };
