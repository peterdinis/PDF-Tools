"use server";

import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";

export async function unlockPDF(
  fileData: ArrayBuffer,
  password?: string
): Promise<{
  success: boolean;
  data?: ArrayBuffer;
  error?: string;
  needsPassword?: boolean;
}> {
  let inputPath: string | null = null;
  let outputPath: string | null = null;

  try {
    if (!fileData || fileData.byteLength === 0) {
      return { success: false, error: "No file data provided" };
    }

    const uniqueId = randomBytes(8).toString("hex");
    inputPath = path.join("/tmp", `input-${uniqueId}.pdf`);
    outputPath = path.join("/tmp", `output-${uniqueId}.pdf`);

    // Write input PDF to temp
    fs.writeFileSync(inputPath, Buffer.from(fileData));

    // Function to run qpdf
    const runQpdf = (args: string[]) =>
      new Promise<void>((resolve, reject) => {
        const qpdf = spawn("qpdf", args);

        let stderr = "";
        qpdf.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        qpdf.on("close", (code) => {
          if (code === 0) resolve();
          else reject(new Error(stderr || `qpdf exited with code ${code}`));
        });
      });

    // First, try decrypting without password
    try {
      await runQpdf(["--decrypt", inputPath, outputPath]);
    } catch {
      // PDF likely password protected
      if (!password) {
        return {
          success: false,
          needsPassword: true,
          error: "PDF is password protected. Please provide the password.",
        };
      }

      // Try decrypting with provided password
      try {
        await runQpdf([
          `--password=${password}`,
          "--decrypt",
          inputPath,
          outputPath,
        ]);
      } catch {
        return {
          success: false,
          error: "Incorrect password. Please check the password and try again.",
        };
      }
    }

    // Read unlocked PDF
    const unlockedBuffer = fs.readFileSync(outputPath);
    if (unlockedBuffer.length === 0) {
      return { success: false, error: "Failed to process PDF. Output file is empty." };
    }

    return {
      success: true,
      data: unlockedBuffer.buffer.slice(
        unlockedBuffer.byteOffset,
        unlockedBuffer.byteOffset + unlockedBuffer.byteLength
      ),
    };
  } catch (error) {
    console.error("Error in unlockPDF:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  } finally {
    // Clean up temp files
    try {
      if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (cleanupError) {
      console.error("Error cleaning up temp files:", cleanupError);
    }
  }
}
