import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Lists previously processed documents, most recent first. */
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ documents: [] });
  }

  try {
    const documents = await prisma.extractedDocument.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        sourceFilename: true,
        vendorName: true,
        documentNumber: true,
        grandTotal: true,
        validationPassed: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ documents });
  } catch (err) {
    console.error("[documents] failed to list records:", err instanceof Error ? err.message : err);
    return NextResponse.json({ documents: [] });
  }
}
