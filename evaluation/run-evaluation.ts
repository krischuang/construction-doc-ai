import { readFileSync } from "fs";
import { join } from "path";
import { processDocument } from "../lib/extract-document";
import { createTransport } from "../lib/claude-transport";
import { EVALUATION_CASES } from "./cases";
import { scoreCase, type CaseScore } from "./scorer";

const SAMPLES_DIR = join(__dirname, "..", "samples");

async function main() {
  const transport = createTransport();
  const usingMock = !process.env.ANTHROPIC_API_KEY;
  console.log(`Running evaluation with ${usingMock ? "the mock transport (no API key set)" : "the live Claude transport"}.\n`);

  const scores: CaseScore[] = [];

  for (const evalCase of EVALUATION_CASES) {
    const text = readFileSync(join(SAMPLES_DIR, evalCase.file), "utf-8");
    const result = await processDocument(text, transport);
    scores.push(scoreCase(evalCase, result));
  }

  printReport(scores);

  const anyFailed = scores.some((s) => !s.allPassed);
  process.exit(anyFailed ? 1 : 0);
}

function printReport(scores: CaseScore[]) {
  const dimensionNames = scores[0]?.dimensions.map((d) => d.dimension) ?? [];
  const totals = Object.fromEntries(dimensionNames.map((d) => [d, 0]));

  for (const score of scores) {
    const icon = score.allPassed ? "PASS" : "FAIL";
    console.log(`[${icon}] ${score.name} (${score.file})`);
    for (const dim of score.dimensions) {
      if (dim.pass) totals[dim.dimension]++;
      if (!dim.pass) {
        console.log(`       - ${dim.dimension}: FAIL, ${dim.detail}`);
      }
    }
  }

  console.log("\nDimension summary:");
  for (const name of dimensionNames) {
    console.log(`  ${name}: ${totals[name]}/${scores.length}`);
  }

  const passedCases = scores.filter((s) => s.allPassed).length;
  console.log(`\nOverall: ${passedCases}/${scores.length} cases fully passed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
