"use client";

import { FC, useState } from "react";
import { ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PDFDocument } from "pdf-lib";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ToolLayout from "@/components/tools/ToolLayout";

type PageSize = "a4" | "letter" | "legal";

const ScanWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [pageSize, setPageSize] = useState<PageSize>("a4");

  const pageSizes = {
    a4: { width: 595, height: 842 },
    letter: { width: 612, height: 792 },
    legal: { width: 612, height: 1008 },
  };

  const handleProcess = async () => {
    if (files.length === 0) return;

    setProcessing(true);

    try {
      const pdfDoc = await PDFDocument.create();
      const size = pageSizes[pageSize];

      for (const file of files) {
        const imageBytes = await file.arrayBuffer();
        let image;

        if (file.type === "image/png") {
          image = await pdfDoc.embedPng(imageBytes);
        } else if (file.type === "image/jpeg" || file.type === "image/jpg") {
          image = await pdfDoc.embedJpg(imageBytes);
        } else {
          continue;
        }

        const page = pdfDoc.addPage([size.width, size.height]);
        const { width: imgWidth, height: imgHeight } = image.scale(1);

        // Calculate scaling to fit page while maintaining aspect ratio
        const scale = Math.min(
          (size.width - 40) / imgWidth,
          (size.height - 40) / imgHeight,
        );

        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;

        page.drawImage(image, {
          x: (size.width - scaledWidth) / 2,
          y: (size.height - scaledHeight) / 2,
          width: scaledWidth,
          height: scaledHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "scanned-document.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error creating PDF:", error);
      alert("Error creating PDF. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolLayout
      title="Scan to PDF"
      description="Convert images to PDF. Upload multiple images and combine them into a single PDF document."
      icon={<ScanLine className="w-8 h-8" />}
      files={files}
      showUpload={true}
      onFilesChange={setFiles}
      acceptedFileTypes=".jpg,.jpeg,.png"
      maxFiles={20}
    >
      {files.length > 0 && (
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Page Size</Label>
            <RadioGroup
              value={pageSize}
              onValueChange={(v) => setPageSize(v as PageSize)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a4" id="a4" />
                <Label htmlFor="a4" className="font-normal cursor-pointer">
                  A4 (210 × 297 mm)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="letter" id="letter" />
                <Label htmlFor="letter" className="font-normal cursor-pointer">
                  Letter (8.5 × 11 in)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="legal" id="legal" />
                <Label htmlFor="legal" className="font-normal cursor-pointer">
                  Legal (8.5 × 14 in)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {files.length} image{files.length !== 1 ? "s" : ""} selected
            </p>
          </div>

          <Button
            onClick={handleProcess}
            disabled={processing}
            className="w-full"
            size="lg"
          >
            {processing ? "Creating PDF..." : "Create PDF"}
          </Button>
        </div>
      )}
    </ToolLayout>
  );
};

export default ScanWrapper;
