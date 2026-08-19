import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * Extract text content from a PDF file buffer with line break preservation
 * @param {Buffer} buffer - The PDF file buffer
 * @returns {Promise<string>}
 */
export const parsePdfBuffer = async (buffer) => {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
    });

    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map((item) => {
          const str = item.str || "";
          return item.hasEOL ? str + "\n" : str + " ";
        })
        .join("");

      fullText += pageText + "\n";
    }

    return fullText.trim();
  } catch (error) {
    console.error("PDF Parsing Error:", error);
    throw new Error("Failed to parse PDF resume");
  }
};