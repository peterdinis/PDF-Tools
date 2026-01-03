"use server";

import { decrypt } from "node-qpdf2";
import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";

export async function unlockPDF(
    fileData: ArrayBuffer,
    password: string,
): Promise<{ success: boolean; data?: ArrayBuffer; error?: string }> {
    let inputPath: string | null = null;
    let outputPath: string | null = null;

    try {
        if (!fileData || fileData.byteLength === 0) {
            return { success: false, error: "No file data provided" };
        }

        const uniqueId = randomBytes(8).toString("hex");
        inputPath = path.join("/tmp", `input-unlock-${uniqueId}.pdf`);
        outputPath = path.join("/tmp", `output-unlock-${uniqueId}.pdf`);

        fs.writeFileSync(inputPath, Buffer.from(fileData));

        // Correct node-qpdf2 syntax for decrypt
        await decrypt({
            input: inputPath,
            output: outputPath,
            password: password,
        });

        if (!fs.existsSync(outputPath)) {
            return { success: false, error: "Failed to generate unlocked PDF" };
        }

        const unlockedBuffer = fs.readFileSync(outputPath);

        return { success: true, data: unlockedBuffer.buffer };
    } catch (error) {
        console.error("Error in unlockPDF:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Invalid password or corrupted file",
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
