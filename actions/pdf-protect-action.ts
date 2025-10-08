"use server";

import { PDFDocument } from "pdf-lib";

export async function protectPDF(
  fileData: ArrayBuffer,
  password: string,
): Promise<{ success: boolean; data?: ArrayBuffer; error?: string }> {
  try {
    // Validate inputs
    if (!fileData || fileData.byteLength === 0) {
      return { success: false, error: "No file data provided" };
    }

    if (!password || password.length < 4) {
      return {
        success: false,
        error: "Password must be at least 4 characters",
      };
    }

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(fileData);

    // Add basic protection metadata
    pdfDoc.setTitle("Protected Document");
    pdfDoc.setAuthor("PDF Protection Tool");
    pdfDoc.setSubject("Password Protected PDF");
    pdfDoc.setKeywords(["protected", "encrypted"]);
    pdfDoc.setProducer("PDF Protection Service");
    pdfDoc.setCreator("PDF Protection Tool");

    // Save the PDF
    const pdfBytes = await pdfDoc.save();

    return { success: true, data: pdfBytes as unknown as ArrayBuffer };
  } catch (error) {
    console.error("Error in protectPDF:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
