"use client";

import { FC, useState } from "react";
import { Crop, Download, Loader2 } from "lucide-react";
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

      pages.forEach((page) => {
        const { width, height } = page.getSize();

        // Calculate crop box to center the content
        const x = Math.max(0, (width - targetSize.width) / 2);
        const y = Math.max(0, (height - targetSize.height) / 2);

        page.setCropBox(
          x,
          y,
          Math.min(targetSize.width, width),
          Math.min(targetSize.height, height),
        );
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      setProcessedUrl(url);
    } catch (error) {
      console.error("Error cropping PDF:", error);
      alert("Failed to crop PDF. Please try again.");
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
              "Crop PDF"
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
