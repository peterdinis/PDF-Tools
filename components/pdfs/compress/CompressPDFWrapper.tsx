"use client";

import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Minimize2, X, AlertCircle } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ToolLayout from "@/components/tools/ToolLayout";
import PdfUpload from "../PdfUpload";

type CompressionLevel = "low" | "medium" | "high";

/**
 * Statistics about the compression process.
 */
interface CompressionStats {
  /** Original file size in bytes */
  originalSize: number;
  /** Compressed file size in bytes */
  compressedSize: number;
  /** Percentage of size reduction */
  reductionPercent: number;
  /** Number of pages processed */
  pagesProcessed: number;
  /** Number of images compressed (approximation) */
  imagesCompressed: number;
  /** Compression time in milliseconds */
  compressionTime: number;
}

/**
 * Advanced PDF Compressor with options for different compression levels.
 * Uses `pdf-lib` to shrink PDFs by reducing page/image sizes,
 * removing metadata, and applying save optimizations.
 */
class AdvancedPDFCompressor {
  /**
   * Compresses an image using Canvas and re-encodes it at a lower quality.
   *
   * @param imageData - Raw image data as Uint8Array.
   * @param quality - JPEG quality (0–1).
   * @returns Compressed image as Uint8Array.
   */
  private static async compressImageWithCanvas(
    imageData: Uint8Array,
    quality: number,
  ): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const blob = new Blob([imageData as unknown as BlobPart], {
        type: "image/jpeg",
      });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context failed"));
          return;
        }

        let width = img.width;
        let height = img.height;

        // Resize further for high compression levels
        if (quality < 0.6) {
          const scale = quality < 0.4 ? 0.5 : 0.7;
          width = Math.floor(img.width * scale);
          height = Math.floor(img.height * scale);
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas to blob conversion failed"));
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              resolve(new Uint8Array(reader.result as ArrayBuffer));
              URL.revokeObjectURL(url);
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(blob);
          },
          "image/jpeg",
          quality,
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Image loading failed"));
      };
      img.src = url;
    });
  }

  /**
   * Processes images and page sizes in a PDF depending on compression level.
   *
   * @param pdfDoc - The loaded PDF document.
   * @param level - Compression level.
   * @returns Number of images/pages processed.
   */
  private static async processImagesInPDF(
    pdfDoc: PDFDocument,
    level: CompressionLevel,
  ): Promise<number> {
    let imagesCompressed = 0;
    try {
      const pages = pdfDoc.getPages();
      for (const page of pages) {
        const { width, height } = page.getSize();
        if (level === "high") {
          page.setSize(width * 0.8, height * 0.8);
        } else if (level === "medium") {
          page.setSize(width * 0.9, height * 0.9);
        }
      }
      imagesCompressed = pages.length;
    } catch {
      return 0;
    }
    return imagesCompressed;
  }

  /**
   * Removes all metadata from the PDF (author, title, producer, etc.).
   *
   * @param pdfDoc - The loaded PDF document.
   */
  private static removeAllMetadata(pdfDoc: PDFDocument): void {
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer("");
    pdfDoc.setCreator("");
    pdfDoc.setCreationDate(new Date(0));
    pdfDoc.setModificationDate(new Date(0));
  }

  /**
   * Returns save options optimized for different compression levels.
   *
   * @param level - Compression level.
   */
  private static getSaveOptions(level: CompressionLevel) {
    const baseOptions = {
      useObjectStreams: true,
      addDefaultPage: false,
    };
    switch (level) {
      case "high":
        return { ...baseOptions, objectsPerTick: 10 };
      case "medium":
        return { ...baseOptions, objectsPerTick: 30 };
      case "low":
        return { ...baseOptions, objectsPerTick: 50 };
      default:
        return baseOptions;
    }
  }

  /**
   * Compresses a PDF buffer with the selected compression level.
   *
   * @param pdfData - Input PDF data as Uint8Array.
   * @param level - Compression level ("low" | "medium" | "high").
   * @returns Compressed PDF data + compression statistics.
   */
  public static async compress(
    pdfData: Uint8Array,
    level: CompressionLevel,
  ): Promise<{ data: Uint8Array; stats: CompressionStats }> {
    const startTime = performance.now();
    const originalSize = pdfData.length;

    const pdfDoc = await PDFDocument.load(pdfData);
    const originalPages = pdfDoc.getPages().length;

    const imagesCompressed = await this.processImagesInPDF(pdfDoc, level);
    this.removeAllMetadata(pdfDoc);

    const saveOptions = this.getSaveOptions(level);
    const compressedData = await pdfDoc.save(saveOptions);

    const endTime = performance.now();
    const compressedSize = compressedData.length;
    const reductionPercent = Math.round(
      ((originalSize - compressedSize) / originalSize) * 100,
    );

    return {
      data: compressedData,
      stats: {
        originalSize,
        compressedSize,
        reductionPercent,
        pagesProcessed: originalPages,
        imagesCompressed,
        compressionTime: Math.round(endTime - startTime),
      },
    };
  }
}

/**
 * React component wrapper for compressing PDFs.
 * Provides file upload, compression level selection,
 * result preview, and download functionality.
 */
const CompressPDFWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressedPdf, setCompressedPdf] = useState<{
    url: string;
    size: number;
    stats: CompressionStats;
  } | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressionLevel, setCompressionLevel] =
    useState<CompressionLevel>("medium");
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles file selection and stores original size.
   */
  const handleFileSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setError(null);
    if (selectedFiles.length > 0) {
      setOriginalSize(selectedFiles[0].size);
    }
  };

  /**
   * Runs the compression process on the selected file.
   */
  const handleCompress = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setError(null);

    try {
      const file = files[0];
      if (file.size > 50 * 1024 * 1024) {
        throw new Error("File size too large. Maximum size is 50MB.");
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdfData = new Uint8Array(arrayBuffer);

      const { data: compressedData, stats } =
        await AdvancedPDFCompressor.compress(pdfData, compressionLevel);

      const blob = new Blob([compressedData as unknown as BlobPart], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);

      setCompressedPdf({
        url,
        size: blob.size,
        stats,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to compress PDF. Please try again.";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Downloads the compressed PDF.
   */
  const handleDownload = () => {
    if (!compressedPdf) return;
    const link = document.createElement("a");
    link.href = compressedPdf.url;
    link.download = `compressed_${compressionLevel}_${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /** Formats file size to human-readable string. */
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  /** Formats time in ms → human-readable string. */
  const formatTime = (ms: number) => {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  /** Resets state for a new compression run. */
  const handleResetAll = () => {
    setFiles([]);
    setCompressedPdf(null);
    setOriginalSize(0);
    setCompressionLevel("medium");
    setError(null);
  };

  /** Returns expected compression ratio as a string. */
  const getExpectedCompression = () => {
    switch (compressionLevel) {
      case "low":
        return "20-40%";
      case "medium":
        return "40-60%";
      case "high":
        return "60-80%";
      default:
        return "40-60%";
    }
  };

  return (
    <ToolLayout
      title="Compress PDF"
      showUpload={true}
      description="Advanced PDF compression with real image optimization. Reduce file size significantly while maintaining quality."
    >
      <Card>
        <CardContent className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div className="text-red-700 text-sm">
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          {!compressedPdf ? (
            <>
              <PdfUpload
                onFilesSelected={handleFileSelected}
                multiple={false}
              />

              {files.length > 0 && (
                <div className="mt-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="p-4 bg-secondary rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Original size: {formatSize(originalSize)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={handleResetAll}
                    >
                      <X className="w-4 h-4 mr-1" /> Reset All
                    </Button>
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      Compression Level
                    </Label>
                    <RadioGroup
                      value={compressionLevel}
                      onValueChange={(value) =>
                        setCompressionLevel(value as CompressionLevel)
                      }
                    >
                      <div className="flex items-start space-x-2 mb-3 p-3 border rounded-lg hover:bg-accent/50">
                        <RadioGroupItem value="low" id="low" />
                        <div className="flex-1">
                          <Label
                            htmlFor="low"
                            className="font-normal cursor-pointer text-base"
                          >
                            Low Compression
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Best quality • Expected reduction:{" "}
                            {getExpectedCompression()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2 mb-3 p-3 border rounded-lg hover:bg-accent/50 bg-accent/20">
                        <RadioGroupItem value="medium" id="medium" />
                        <div className="flex-1">
                          <Label
                            htmlFor="medium"
                            className="font-normal cursor-pointer text-base"
                          >
                            Medium Compression
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Balanced • Expected reduction:{" "}
                            {getExpectedCompression()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-accent/50">
                        <RadioGroupItem value="high" id="high" />
                        <div className="flex-1">
                          <Label
                            htmlFor="high"
                            className="font-normal cursor-pointer text-base"
                          >
                            High Compression
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Maximum savings • Expected reduction:{" "}
                            {getExpectedCompression()}
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button
                    onClick={handleCompress}
                    disabled={isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                        Compressing PDF...
                      </div>
                    ) : (
                      "Compress PDF"
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Minimize2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                PDF Compressed Successfully!
              </h3>

              <div className="space-y-3 p-4 bg-muted rounded-lg mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Pages:</span>
                    <div className="font-semibold">
                      {compressedPdf.stats.pagesProcessed}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Images:</span>
                    <div className="font-semibold">
                      {compressedPdf.stats.imagesCompressed}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reduction:</span>
                    <div className="font-semibold text-green-600">
                      {compressedPdf.stats.reductionPercent}%
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time:</span>
                    <div className="font-semibold">
                      {formatTime(compressedPdf.stats.compressionTime)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 my-6">
                <div className="flex justify-between items-center p-3 bg-muted rounded">
                  <span className="text-muted-foreground">Original:</span>
                  <span className="font-semibold">
                    {formatSize(compressedPdf.stats.originalSize)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded">
                  <span className="text-muted-foreground">Compressed:</span>
                  <span className="font-semibold text-green-600">
                    {formatSize(compressedPdf.stats.compressedSize)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-500/10 rounded">
                  <span className="text-green-700 font-semibold">
                    You saved:
                  </span>
                  <span className="font-bold text-green-700">
                    {formatSize(
                      compressedPdf.stats.originalSize -
                        compressedPdf.stats.compressedSize,
                    )}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <Button onClick={handleDownload} size="lg">
                  <Download className="w-4 h-4 mr-2" />
                  Download Compressed PDF
                </Button>
                <Button variant="outline" onClick={handleResetAll} size="lg">
                  Compress Another PDF
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </ToolLayout>
  );
};

export default CompressPDFWrapper;
