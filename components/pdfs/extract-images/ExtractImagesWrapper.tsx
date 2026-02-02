"use client";

import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Image as ImageLucide, Loader2, AlertCircle, X } from "lucide-react";
import { downloadBlob, downloadMultiple } from "@/lib/download";
import { PDFDocument } from "pdf-lib";
import ToolLayout from "@/components/tools/ToolLayout";
import PdfUpload from "../PdfUpload";

interface ExtractedImage {
  index: number;
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
}

const ExtractImagesWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedImages, setExtractedImages] = useState<ExtractedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(
    null,
  );

  const handleFileSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setError(null);
    setExtractedImages([]);
  };

  const extractImages = async (file: File): Promise<ExtractedImage[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const images: ExtractedImage[] = [];

    const pages = pdfDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const embeddedImages = await page.embeddedImages();

      for (const [name, image] of Object.entries(embeddedImages)) {
        try {
          const imageBytes = await image.embed();
          const imageDims = image.scale(1);

          // Convert to blob
          const blob = new Blob([imageBytes as unknown as BlobPart], {
            type: "image/png",
          });

          // Create data URL for preview
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          images.push({
            index: images.length + 1,
            dataUrl,
            blob,
            width: imageDims.width,
            height: imageDims.height,
          });
        } catch (err) {
          console.error(`Error extracting image ${name}:`, err);
        }
      }
    }

    return images;
  };

  const handleExtract = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setExtractedImages([]);

    try {
      const file = files[0];
      if (file.size > 50 * 1024 * 1024) {
        throw new Error("File size too large. Maximum size is 50MB.");
      }

      const images = await extractImages(file);
      if (images.length === 0) {
        throw new Error("No images found in this PDF.");
      }

      setExtractedImages(images);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to extract images from PDF. Please try again.";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    if (extractedImages.length === 0) return;

    setIsDownloading(true);
    try {
      const files = extractedImages.map((image) => ({
        blob: image.blob,
        filename: `extracted_image_${image.index}.png`,
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

  const handleDownloadSingle = async (image: ExtractedImage) => {
    setDownloadingIndex(image.index);
    try {
      const success = await downloadBlob(
        image.blob,
        `extracted_image_${image.index}.png`,
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
    setExtractedImages([]);
    setError(null);
  };

  return (
    <ToolLayout
      title="Extract Images from PDF"
      showUpload={true}
      description="Extract all images embedded in PDF files and download them individually."
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

          {extractedImages.length === 0 ? (
            <>
              <PdfUpload
                onFilesSelected={handleFileSelected}
                multiple={false}
              />

              {files.length > 0 && (
                <div className="mt-6">
                  <Button
                    onClick={handleExtract}
                    disabled={isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Extracting images...
                      </div>
                    ) : (
                      <>
                        <ImageLucide className="w-4 h-4 mr-2" />
                        Extract Images
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
                  Extracted Images ({extractedImages.length} found)
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

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {extractedImages.map((image) => (
                  <div
                    key={image.index}
                    className="border rounded-lg overflow-hidden bg-muted/50"
                  >
                    <div className="aspect-square bg-white flex items-center justify-center overflow-hidden">
                      <img
                        src={image.dataUrl}
                        alt={`Extracted image ${image.index}`}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Image {image.index}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadSingle(image)}
                          disabled={downloadingIndex === image.index}
                        >
                          {downloadingIndex === image.index ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Download className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {image.width} × {image.height}px
                      </p>
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
                      Download All Images
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleReset} size="lg">
                  Extract from Another PDF
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </ToolLayout>
  );
};

export default ExtractImagesWrapper;
