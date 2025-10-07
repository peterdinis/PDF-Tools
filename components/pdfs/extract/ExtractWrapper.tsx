"use client";

import { FC, useState } from "react";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import ToolLayout from "@/components/tools/ToolLayout";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type ExtractMode = "images" | "text" | "pages";

const ExtractWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [extractMode, setExtractMode] = useState<ExtractMode>("images");
  const [pageRange, setPageRange] = useState("");
  const [extractedCount, setExtractedCount] = useState(0);

  const handleProcess = async () => {
    if (files.length === 0) return;

    setProcessing(true);

    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();

      if (extractMode === "images") {
        await extractImages(arrayBuffer);
      } else if (extractMode === "text") {
        await extractText(arrayBuffer);
      } else if (extractMode === "pages") {
        await extractPages(arrayBuffer);
      }
    } catch (error) {
      console.error("Error extracting from PDF:", error);
      alert("Error extracting from PDF. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const extractImages = async (arrayBuffer: ArrayBuffer) => {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let imageCount = 0;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d")!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // ✅ přidán canvas
      await page.render({
        canvasContext: context,
        viewport,
        canvas,
      }).promise;

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `page-${i}.png`;
          a.click();
          URL.revokeObjectURL(url);
          imageCount++;
          setExtractedCount(imageCount);
        }
      }, "image/png");
    }
  };

  const extractText = async (arrayBuffer: ArrayBuffer) => {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += `\n\n--- Page ${i} ---\n\n${pageText}`;
    }

    const blob = new Blob([fullText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "extracted-text.txt";
    a.click();
    URL.revokeObjectURL(url);

    setExtractedCount(pdf.numPages);
  };

  const extractPages = async (arrayBuffer: ArrayBuffer) => {
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const totalPages = pdfDoc.getPageCount();

    let pagesToExtract: number[] = [];
    if (pageRange) {
      const ranges = pageRange.split(",");
      for (const range of ranges) {
        if (range.includes("-")) {
          const [start, end] = range
            .split("-")
            .map((n) => Number.parseInt(n.trim()));
          for (let i = start; i <= end && i <= totalPages; i++) {
            pagesToExtract.push(i - 1);
          }
        } else {
          const pageNum = Number.parseInt(range.trim());
          if (pageNum > 0 && pageNum <= totalPages) {
            pagesToExtract.push(pageNum - 1);
          }
        }
      }
    } else {
      pagesToExtract = Array.from({ length: totalPages }, (_, i) => i);
    }

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdfDoc, pagesToExtract);
    copiedPages.forEach((page) => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    const blob = new Blob([pdfBytes as unknown as BlobPart], {
      type: "application/pdf",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "extracted-pages.pdf";
    a.click();
    URL.revokeObjectURL(url);

    setExtractedCount(pagesToExtract.length);
  };

  return (
    <ToolLayout
      title="Extract PDF"
      description="Extract images, text, or pages from your PDF files. Get all the data you need from your documents."
      icon={<FileDown className="w-8 h-8" />}
      files={files}
      onFilesChange={setFiles}
      acceptedFileTypes=".pdf"
      maxFiles={1}
      showUpload={true}
    >
      {files.length > 0 && (
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Extract Mode</Label>
            <RadioGroup
              value={extractMode}
              onValueChange={(v) => setExtractMode(v as ExtractMode)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="images" id="images" />
                <Label htmlFor="images" className="font-normal cursor-pointer">
                  Extract as images (PNG)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="text" id="text" />
                <Label htmlFor="text" className="font-normal cursor-pointer">
                  Extract text content
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pages" id="pages" />
                <Label htmlFor="pages" className="font-normal cursor-pointer">
                  Extract specific pages
                </Label>
              </div>
            </RadioGroup>
          </div>

          {extractMode === "pages" && (
            <div className="space-y-2">
              <Label htmlFor="pageRange">Page Range (e.g., 1-3, 5, 7-9)</Label>
              <Input
                id="pageRange"
                placeholder="1-3, 5, 7-9"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to extract all pages
              </p>
            </div>
          )}

          {extractedCount > 0 && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Successfully extracted {extractedCount}{" "}
                {extractMode === "images"
                  ? "image(s)"
                  : extractMode === "text"
                    ? "page(s) of text"
                    : "page(s)"}
              </p>
            </div>
          )}

          <Button
            onClick={handleProcess}
            disabled={processing}
            className="w-full"
            size="lg"
          >
            {processing ? "Extracting..." : "Extract"}
          </Button>
        </div>
      )}
    </ToolLayout>
  );
};

export default ExtractWrapper;
