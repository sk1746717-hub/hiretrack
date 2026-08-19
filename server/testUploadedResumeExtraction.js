import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { parsePdfBuffer } from "./utils/pdfParser.js";
import * as mlService from "./services/mlService.js";

const RESUME_FILENAME = "1787134827330-Sampath_Kumar_Resume_updated.pdf";

async function testExtraction() {
  console.log("=== Testing Actual Uploaded PDF Resume Extraction ===");

  const candidatePaths = [
    path.join(process.cwd(), "uploads", RESUME_FILENAME),
    path.join(process.cwd(), "server", "uploads", RESUME_FILENAME),
  ];

  let resolvedPath = null;
  for (const p of candidatePaths) {
    if (fsSync.existsSync(p)) {
      resolvedPath = p;
      break;
    }
  }

  if (!resolvedPath) {
    console.error(`❌ Could not locate ${RESUME_FILENAME} on disk in searched locations:`, candidatePaths);
    process.exit(1);
  }

  console.log(`[AI Resume Analysis] Reading local resume: ${resolvedPath}`);

  const buffer = await fs.readFile(resolvedPath);
  console.log(`[AI Resume Analysis] Read ${buffer.length} bytes from PDF file.`);

  const extractedText = await parsePdfBuffer(buffer);
  const charCount = extractedText ? extractedText.length : 0;

  console.log(`[AI Resume Analysis] PDF text extracted successfully. Character count: ${charCount}`);

  if (charCount === 0) {
    console.error("❌ Extracted text is empty!");
    process.exit(1);
  }

  console.log("\nSample Extracted Resume Text Snippet:");
  console.log("------------------------------------");
  console.log(extractedText.slice(0, 300));
  console.log("------------------------------------\n");

  console.log("[AI Resume Analysis] Sending extracted text to Python AIML engine...");
  const aimlResult = await mlService.analyzeResume(extractedText);

  console.log("\nPython AIML Resume Analysis Result:");
  console.log(JSON.stringify(aimlResult, null, 2));

  const hasSkills = Object.values(aimlResult.analysis?.skills || {}).some(arr => arr.length > 0);
  const hasEducation = (aimlResult.analysis?.education || []).length > 0;

  if (aimlResult.success && hasSkills && hasEducation) {
    console.log("\n✅ SUCCESS: Uploaded PDF resume extracted & analyzed by AIML engine!");
  } else {
    console.warn("\n⚠️ Analysis completed, but some fields were empty. Review JSON output above.");
  }
}

testExtraction();
