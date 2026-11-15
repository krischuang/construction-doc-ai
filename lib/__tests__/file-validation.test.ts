import { describe, it, expect } from "vitest";
import { validateUpload, MAX_UPLOAD_BYTES } from "../file-validation";

describe("validateUpload", () => {
  it("accepts a valid text file under the size limit", () => {
    const result = validateUpload({ size: 1024, type: "text/plain", name: "invoice.txt" });
    expect(result.valid).toBe(true);
  });

  it("accepts a valid pdf file under the size limit", () => {
    const result = validateUpload({ size: 1024, type: "application/pdf", name: "invoice.pdf" });
    expect(result.valid).toBe(true);
  });

  it("rejects a file over the size limit", () => {
    const result = validateUpload({ size: MAX_UPLOAD_BYTES + 1, type: "text/plain", name: "invoice.txt" });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/exceeds/);
  });

  it("rejects an unsupported mime type", () => {
    const result = validateUpload({ size: 1024, type: "application/zip", name: "invoice.zip" });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Unsupported file type/);
  });

  it("rejects a mismatched extension even with an allowed mime type", () => {
    const result = validateUpload({ size: 1024, type: "text/plain", name: "invoice.exe" });
    expect(result.valid).toBe(false);
  });
});
