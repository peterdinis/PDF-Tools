"use server";

import { encrypt } from "node-qpdf2";
import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";

/**
 * Encrypts (password-protects) a given PDF file using qpdf.
 *
 * This function:
 * - Writes the provided PDF data to a temporary file.
 * - Uses `node-qpdf2` to encrypt it with the given password.
 * - Returns the encrypted PDF as an ArrayBuffer.
 * - Cleans up temporary files after processing.
 *
 * @async
 * @param {ArrayBuffer} fileData - The binary data of the PDF file to protect.
 * @param {string} password - The password to apply to the PDF (minimum 4 characters).
 * 
 * @returns {Promise<{ success: boolean; data?: ArrayBuffer; error?: string }>} 
 * - `success: true` and `data` containing the encrypted PDF as ArrayBuffer if successful.  
 * - `success: false` and `error` containing the error message if failed.
 *
 * @throws {Error} If qpdf fails or file operations cannot be performed.
 *
 * @example
 * ```ts
 * const pdfBuffer = await fetch("/example.pdf").then(res => res.arrayBuffer());
 * const result = await protectPDF(pdfBuffer, "secure123");
 * 
 * if (result.success && result.data) {
 *   // Use result.data (encrypted PDF as ArrayBuffer)
 * } else {
 *   console.error("Encryption failed:", result.error);
 * }
 * ```
 */
export async function protectPDF(
  fileData: ArrayBuffer,
  password: string,
): Promise<{ success: boolean; data?: ArrayBuffer; error?: string }> {
  let inputPath: string | null = null;
  let outputPath: string | null = null;

  try {
    if (!fileData || fileData.byteLength === 0) {
      return { success: false, error: "No file data provided" };
    }

    if (!password || password.length < 4) {
      return {
        success: false,
        error: "Password must be at least 4 characters",
      };
    }

    const uniqueId = randomBytes(8).toString("hex");
    inputPath = path.join("/tmp", `input-${uniqueId}.pdf`);
    outputPath = path.join("/tmp", `output-${uniqueId}.pdf`);

    fs.writeFileSync(inputPath, Buffer.from(fileData));
    
    await encrypt({
      input: inputPath,
      output: outputPath,
      password: password,
      keyLength: 128,
      restrictions: {
        print: "low",
        modify: "none",
        extract: "n",
        useAes: "y",
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
  } finally {
    try {
      if (inputPath && fs.existsSync(inputPath)) {
        fs.unlinkSync(inputPath);
      }
      if (outputPath && fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    } catch (cleanupError) {
      console.error("Error cleaning up temp files:", cleanupError);
    }
  }
}
