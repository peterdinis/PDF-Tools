// app/api/cropPDF.ts
import fs from "fs";
import { crop } from "pdf-cropper";
import path from "path";

/**
 * Crops a PDF file automatically.
 * @param inputBuffer PDF file as ArrayBuffer
 * @param margin optional margin to leave around content
 * @returns Cropped PDF as ArrayBuffer
 */
export async function cropPDF(inputBuffer: ArrayBuffer, margin = 10) {
  const inputPath = path.join("/tmp", `input_${Date.now()}.pdf`);
  const outputPath = path.join("/tmp", `output_${Date.now()}.pdf`);

  fs.writeFileSync(inputPath, Buffer.from(inputBuffer));

  await crop(inputPath, outputPath, {
    top: margin,
    bottom: margin,
    left: margin,
    right: margin,
  });

  const cropped = fs.readFileSync(outputPath);

  fs.unlinkSync(inputPath);
  fs.unlinkSync(outputPath);

  return cropped.buffer;
}
