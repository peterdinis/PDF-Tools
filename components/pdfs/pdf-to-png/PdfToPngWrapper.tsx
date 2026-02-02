"use client";

import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, ImageIcon, Loader2, AlertCircle, X } from "lucide-react";
import { downloadBlob, downloadMultiple } from "@/lib/download";
import ToolLayout from "@/components/tools/ToolLayout";
import PdfUpload from "../PdfUpload";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface ConvertedImage {
  pageNumber: number;
  dataUrl: string;
  blob: Blob;
}

const PdfToPngWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [convertedImages, setConvertedImages] = useState<ConvertedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(2);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(
    null,
  );

  const handleFileSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setError(null);
    setConvertedImages([]);
  };

  const convertPageToPNG = async (
    pdf: pdfjsLib.PDFDocumentProxy,
    pageNum: number,
    scaleValue: number,
  ): Promise<ConvertedImage> => {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: scaleValue });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to get canvas context");
    }

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    const dataUrl = canvas.toDataURL("image/png");
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else throw new Error("Failed to create blob");
      }, "image/png");
    });

    return {
      pageNumber: pageNum,
      dataUrl,
      blob,
    };
  };

  const handleConvert = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setConvertedImages([]);

    try {
      const file = files[0];
      if (file.size > 50 * 1024 * 1024) {
        throw new Error("File size too large. Maximum size is 50MB.");
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const images: ConvertedImage[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const image = await convertPageToPNG(pdf, i, scale);
        images.push(image);
      }

      setConvertedImages(images);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to convert PDF to PNG. Please try again.";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    if (convertedImages.length === 0) return;

    setIsDownloading(true);
    try {
      const files = convertedImages.map((image) => ({
        blob: image.blob,
        filename: `page_${image.pageNumber}.png`,
      }));

      const result = await downloadMultiple(files, 200);
      if (result.failed > 0) {
        setError(
          `Failed to download ${result.failed} file(s). Please try again.`,
        );
      }
    } catch (error) {
      setError("Failed to download files. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSingle = async (image: ConvertedImage) => {
    setDownloadingIndex(image.pageNumber);
    try {
      const success = await downloadBlob(
        image.blob,
        `page_${image.pageNumber}.png`,
      );
      if (!success) {
        setError("Failed to download file. Please try again.");
      }
    } catch (error) {
      setError("Failed to download file. Please try again.");
    } finally {
      setDownloadingIndex(null);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setConvertedImages([]);
    setError(null);
  };

  return (
    <ToolLayout
      title="PDF to PNG"
      showUpload={true}
      description="Convert PDF pages to high-quality PNG images with customizable settings."
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

          {convertedImages.length === 0 ? (
            <>
              <PdfUpload
                onFilesSelected={handleFileSelected}
                multiple={false}
              />

              {files.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Image Quality (Scale): {scale}x
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      step="0.5"
                      value={scale}
                      onChange={(e) => setScale(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Lower (1x)</span>
                      <span>Higher (4x)</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Higher scale = better quality but larger file size
                    </p>
                  </div>

                  <Button
                    onClick={handleConvert}
                    disabled={isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Converting to PNG...
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Convert to PNG
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Converted Images ({convertedImages.length} pages)
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    <X className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleDownloadAll}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download All
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {convertedImages.map((image) => (
                  <div
                    key={image.pageNumber}
                    className="border rounded-lg overflow-hidden bg-muted/50"
                  >
                    <div className="aspect-[3/4] bg-white flex items-center justify-center overflow-hidden">
                      <img
                        src={image.dataUrl}
                        alt={`Page ${image.pageNumber}`}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Page {image.pageNumber}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadSingle(image)}
                        disabled={downloadingIndex === image.pageNumber}
                      >
                        {downloadingIndex === image.pageNumber ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Download className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleDownloadAll}
                  size="lg"
                  className="flex-1"
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download All PNGs
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleReset} size="lg">
                  Convert Another PDF
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </ToolLayout>
  );
};

export default PdfToPngWrapper;
