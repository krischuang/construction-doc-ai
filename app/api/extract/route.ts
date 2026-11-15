import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { validateUpload } from "@/lib/file-validation";
import { extractPdfText } from "@/lib/pdf-text";
import { processDocument } from "@/lib/extract-document";
import { isSampleFile } from "@/lib/sample-files";
import { prisma } from "@/lib/prisma";

/** POST a bundled sample by name, or an uploaded .txt/.pdf file. */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    let documentText: string;
    let sourceFilename: string;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      const { sampleFile } = body as { sampleFile?: string };
      if (!sampleFile || !isSampleFile(sampleFile)) {
        return NextResponse.json({ error: "Unknown sample file" }, { status: 400 });
      }
      sourceFilename = sampleFile;
      // samples/ is bundled read-only reference data, not an arbitrary path
      // join: isSampleFile() above restricts this to the fixed allowlist.
      documentText = await readFile(join(process.cwd(), "samples", sampleFile), "utf-8");
    } else {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const validation = validateUpload({ size: file.size, type: file.type, name: file.name });
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 413 });
      }

      sourceFilename = file.name;
      const buffer = Buffer.from(await file.arrayBuffer());
      documentText = file.type === "application/pdf" ? await extractPdfText(buffer) : buffer.toString("utf-8");
    }

    const result = await processDocument(documentText);

    // Persist the record when a database is configured. Extraction and
    // validation already happened above and are returned to the caller
    // either way, so a missing or unreachable database degrades to
    // "results not saved" rather than failing the whole request.
    if (process.env.DATABASE_URL) {
      try {
        await prisma.extractedDocument.create({
          data: {
            sourceFilename,
            rawText: documentText,
            vendorName: result.data.vendorName,
            documentNumber: result.data.documentNumber,
            documentDate: result.data.documentDate,
            subtotal: result.data.subtotal,
            tax: result.data.tax,
            grandTotal: result.data.grandTotal,
            lineItems: result.data.lineItems,
            validationPassed: result.validation.passed,
            validationIssues: result.validation.issues,
          },
        });
      } catch (dbErr) {
        console.error("[extract] failed to persist record:", dbErr instanceof Error ? dbErr.message : dbErr);
      }
    }

    return NextResponse.json({
      sourceFilename,
      documentText,
      ...result,
    });
  } catch (err) {
    // Do not log raw document text, only the error, to avoid leaking
    // document content (which may include commercially sensitive pricing)
    // into server logs.
    console.error("[extract] failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
