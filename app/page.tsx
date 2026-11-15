"use client";

import { useState } from "react";
import type { ExtractedDocumentData } from "@/lib/extraction-schema";
import type { ValidationResult } from "@/lib/validate-extraction";
import { SAMPLE_FILES } from "@/lib/sample-files";

type ExtractResponse = {
  sourceFilename: string;
  documentText: string;
  data: ExtractedDocumentData;
  validation: ValidationResult;
};

type ErpSendResult = { ok: boolean; status: number; body: unknown } | { error: string; issues?: unknown };

export default function HomePage() {
  const [selectedSample, setSelectedSample] = useState(SAMPLE_FILES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [erpResult, setErpResult] = useState<ErpSendResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSample() {
    setLoading(true);
    setError(null);
    setErpResult(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleFile: selectedSample }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Extraction failed");
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setLoading(false);
    }
  }

  async function runUpload() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setErpResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Extraction failed");
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setLoading(false);
    }
  }

  async function sendToErp() {
    if (!result) return;
    setErpResult(null);
    const res = await fetch("/api/send-to-erp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.data),
    });
    const json = await res.json();
    setErpResult(json);
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Construction Document AI</h1>
      <p className="text-slate-600 mb-8">
        Upload a construction invoice or tender, or try a bundled sample, to see it turned into
        structured, trade-categorised, validated data.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="border rounded-lg p-4 bg-white">
          <h2 className="font-semibold mb-3">Try a sample document</h2>
          <select
            className="w-full border rounded px-3 py-2 mb-3"
            value={selectedSample}
            onChange={(e) => setSelectedSample(e.target.value)}
          >
            {SAMPLE_FILES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <button
            onClick={runSample}
            disabled={loading}
            className="w-full bg-slate-900 text-white rounded px-4 py-2 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Run sample"}
          </button>
        </div>

        <div className="border rounded-lg p-4 bg-white">
          <h2 className="font-semibold mb-3">Upload your own (.txt or .pdf, max 5MB)</h2>
          <input
            type="file"
            accept=".txt,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full mb-3"
          />
          <button
            onClick={runUpload}
            disabled={loading || !file}
            className="w-full bg-slate-900 text-white rounded px-4 py-2 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Extract"}
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 mb-6">{error}</p>}

      {result && (
        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">{result.data.vendorName}</h2>
              <p className="text-slate-600">
                {result.data.documentNumber} &middot; {result.data.documentDate}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                result.validation.passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {result.validation.passed ? "Validation passed" : "Validation failed"}
            </span>
          </div>

          {!result.validation.passed && (
            <ul className="mb-4 text-sm text-red-700 list-disc list-inside">
              {result.validation.issues.map((issue, i) => (
                <li key={i}>
                  {issue.field}: {issue.message}
                </li>
              ))}
            </ul>
          )}

          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2">Description</th>
                <th className="py-2">Trade</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Unit Price</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {result.data.lineItems.map((item, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2">{item.description}</td>
                  <td className="py-2">
                    <span className="bg-slate-100 rounded px-2 py-0.5 text-xs">{item.tradeCategory}</span>
                  </td>
                  <td className="py-2 text-right">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="py-2 text-right">${item.unitPrice.toFixed(2)}</td>
                  <td className="py-2 text-right">${item.lineTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-right text-sm mb-6">
            <p>Subtotal: ${result.data.subtotal.toFixed(2)}</p>
            <p>Tax: ${result.data.tax.toFixed(2)}</p>
            <p className="font-semibold">Grand total: ${result.data.grandTotal.toFixed(2)}</p>
          </div>

          <button
            onClick={sendToErp}
            disabled={!result.validation.passed}
            className="bg-emerald-700 text-white rounded px-4 py-2 disabled:opacity-50"
          >
            Send to ERP (mock webhook)
          </button>

          {erpResult && (
            <pre className="mt-4 bg-slate-100 rounded p-3 text-xs overflow-x-auto">
              {JSON.stringify(erpResult, null, 2)}
            </pre>
          )}
        </div>
      )}
    </main>
  );
}
