"use client";

import { FC, useState } from "react";
import { Crop, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ToolLayout from "@/components/tools/ToolLayout";
import { PDFDocument } from "pdf-lib";

/**
 * CropWrapper component allows users to upload a PDF,
 * automatically crop pages to remove margins, and download it.
 */
const CropWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);

  /**
   * Automatic crop action: removes 5-20pt margins from all pages.
   */
  const handleProcess = async () => {
    if (files.length === 0) return;
    setProcessing(true);

    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      const pages = pdfDoc.getPages();

      pages.forEach((page) => {
        const { width, height } = page.getSize();

        // Simple auto-crop: remove 5% margins
        const marginX = width * 0.05;
        const marginY = height * 0.05;

        page.setCropBox(
          marginX,
          marginY,
          width - 2 * marginX,
          height - 2 * marginY
        );
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      setProcessedUrl(url);
    } catch (err) {
      console.error("Error cropping PDF:", err);
      alert("Failed to crop PDF automatically.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedUrl) return;
    const link = document.createElement("a");
    link.href = processedUrl;
    link.download = "cropped.pdf";
    link.click();
  };

  return (
    <ToolLayout
      title="Crop PDF"
      description="Automatically crop PDF pages to remove margins"
      icon={<Crop className="w-8 h-8" />}
      files={files}
      onFilesChange={setFiles}
      acceptedFileTypes=".pdf"
      maxFiles={1}
      showUpload={true}
    >
      {files.length > 0 && !processedUrl && (
        <div className="space-y-4">
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
              "Auto Crop PDF"
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
            <Button onClick={handleDownload} size="lg">
              <Download className="w-4 h-4 mr-2" />
              Download Cropped PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFiles([]);
                setProcessedUrl(null);
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
