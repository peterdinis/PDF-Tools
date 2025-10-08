"use server";

import qpdf from "node-qpdf";
import fs from "fs";

export async function protectPDF(
  fileData: ArrayBuffer,
  password: string,
): Promise<{ success: boolean; data?: ArrayBuffer; error?: string }> {
  try {
    if (!fileData || fileData.byteLength === 0) {
      return { success: false, error: "No file data provided" };
    }

    if (!password || password.length < 4) {
      return { success: false, error: "Password must be at least 4 characters" };
    }

    // Ulož input PDF do temporary súboru
    const inputPath = "/tmp/input.pdf";
    const outputPath = "/tmp/output.pdf";
    fs.writeFileSync(inputPath, Buffer.from(fileData));

    // Nastavenie hesla pomocou qpdf
    qpdf.encrypt(inputPath, outputPath, {
      password: password,         // user password
      keyLength: 128,             // alebo 256 pre silnejšie šifrovanie
      restrictions: {
        print: "low",             // "none" | "low" | "high"
        modify: false,
        extract: false,
        annotate: false,
      },
    });

    const protectedBuffer = fs.readFileSync(outputPath);

    return { success: true, data: protectedBuffer.buffer };
  } catch (error) {
    console.error("Error in protectPDF:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
