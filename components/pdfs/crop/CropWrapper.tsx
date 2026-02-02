"use client";

import { FC, useState } from "react";
import { Crop, Download, Loader2, AlertCircle } from "lucide-react";
import { downloadFromUrl } from "@/lib/download";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PDFDocument } from "pdf-lib";
import ToolLayout from "@/components/tools/ToolLayout";

const CropWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [cropSize, setCropSize] = useState("a4");
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleProcess = async () => {
    if (files.length === 0) return;

    setProcessing(true);
    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      const sizes: Record<string, { width: number; height: number }> = {
        a4: { width: 595, height: 842 },
        letter: { width: 612, height: 792 },
        legal: { width: 612, height: 1008 },
      };

      const targetSize = sizes[cropSize];

      // Create a new PDF document with cropped pages
      const newPdfDoc = await PDFDocument.create();

      for (const page of pages) {
        const { width: originalWidth, height: originalHeight } =
          page.getSize();

        // Create new page with target size
        const newPage = newPdfDoc.addPage([targetSize.width, targetSize.height]);

        // Embed the original page
        const embeddedPage = await newPdfDoc.embedPage(page, {
          left: 0,
          bottom: 0,
          width: originalWidth,
          height: originalHeight,
        });

        // Calculate scale to fit content while maintaining aspect ratio
        const scaleX = targetSize.width / originalWidth;
        const scaleY = targetSize.height / originalHeight;
        const scale = Math.min(scaleX, scaleY);

        // Calculate scaled dimensions
        const scaledWidth = originalWidth * scale;
        const scaledHeight = originalHeight * scale;

        // Center the content
        const x = (targetSize.width - scaledWidth) / 2;
        const y = (targetSize.height - scaledHeight) / 2;

        // Draw the embedded page scaled and centered
        newPage.drawPage(embeddedPage, {
          x: x,
          y: y,
          width: scaledWidth,
          height: scaledHeight,
        });
      }

      const pdfBytes = await newPdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      setProcessedUrl(url);
      setError(null);
    } catch (error) {
      console.error("Error cropping PDF:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to crop PDF. Please try again.";
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!processedUrl) return;

    setIsDownloading(true);
    try {
      const filename = `cropped_${cropSize}_${Date.now()}.pdf`;
      const success = await downloadFromUrl(processedUrl, filename);

      if (!success) {
        setError("Failed to download file. Please try again.");
      }
    } catch (error) {
      setError("Failed to download file. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <ToolLayout
      title="Crop PDF"
      description="Crop and trim PDF pages to desired size"
      icon={<Crop className="w-8 h-8" />}
      files={files}
      onFilesChange={setFiles}
      acceptedFileTypes=".pdf"
      maxFiles={1}
      showUpload={true}
    >
      {files.length > 0 && !processedUrl && (
        <div className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div className="text-red-700 text-sm">
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="cropSize">Page Size</Label>
            <Select value={cropSize} onValueChange={setCropSize}>
              <SelectTrigger id="cropSize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a4">A4 (210 × 297 mm)</SelectItem>
                <SelectItem value="letter">Letter (8.5 × 11 in)</SelectItem>
                <SelectItem value="legal">Legal (8.5 × 14 in)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleProcess}
            disabled={processing}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cropping...
              </>
            ) : (
              <>
                <Crop className="w-4 h-4 mr-2" />
                Crop PDF
              </>
            )}
          </Button>
        </div>
      )}

      {processedUrl && (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Download className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            PDF Cropped Successfully!
          </h3>
          <p className="text-muted-foreground mb-6">
            Your cropped PDF is ready to download.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleDownload}
              size="lg"
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
                  Download Cropped PDF
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFiles([]);
                setProcessedUrl(null);
                setError(null);
              }}
              size="lg"
            >
              Crop Another PDF
            </Button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};

export default CropWrapper;
