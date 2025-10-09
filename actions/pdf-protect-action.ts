"use server";

import { encrypt } from "node-qpdf2";
import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";

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

    // Correct node-qpdf2 syntax - single options object
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
