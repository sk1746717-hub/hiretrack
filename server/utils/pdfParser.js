import pdf from "pdf-parse/lib/pdf-parse.js";

/**
 * Extract text content from a PDF file buffer
 * @param {Buffer} buffer - The PDF file buffer
 * @returns {Promise<string>}
 */
export const parsePdfBuffer = async (buffer) => {
  try {
    const data = await pdf(buffer);
    return data.text || "";
  } catch (error) {
    console.error("PDF Parsing Error:", error);
    throw new Error("Failed to parse PDF resume");
  }
};