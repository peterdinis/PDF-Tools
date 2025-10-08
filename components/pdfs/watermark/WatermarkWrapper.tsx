"use client";

import { FC, useState } from "react";
import { Droplet, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PDFDocument, rgb, Rotation, StandardFonts } from "pdf-lib";
import ToolLayout from "@/components/tools/ToolLayout";

const WatermarkWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [watermarkText, setWatermarkText] = useState("");
  const [opacity, setOpacity] = useState("0.3");
  const [position, setPosition] = useState("center");
  const [applyToAll, setApplyToAll] = useState(true);
  const [selectedPages, setSelectedPages] = useState("1");
  const [totalPages, setTotalPages] = useState(0);

  const handleFileSelected = async (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    if (selectedFiles.length > 0) {
      try {
        const file = selectedFiles[0];
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();
        setTotalPages(pages.length);
        // Reset selected pages to all pages when new file is selected
        setSelectedPages(
          Array.from({ length: pages.length }, (_, i) => i + 1).join(","),
        );
      } catch (error) {
        console.error("Error loading PDF:", error);
      }
    }
  };

  const parsePageSelection = (selection: string): number[] => {
    const pages: number[] = [];
    const parts = selection.split(",");

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes("-")) {
        // Handle ranges like "1-5"
        const [start, end] = trimmed
          .split("-")
          .map((num) => Number.parseInt(num.trim()));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= totalPages) {
              pages.push(i - 1); // Convert to 0-based index
            }
          }
        }
      } else {
        // Handle single numbers
        const pageNum = Number.parseInt(trimmed);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
          pages.push(pageNum - 1); // Convert to 0-based index
        }
      }
    }

    // Remove duplicates and sort
    return [...new Set(pages)].sort((a, b) => a - b);
  };

  const handleProcess = async () => {
    if (files.length === 0 || !watermarkText) return;

    setProcessing(true);
    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontSize = 48;
      const opacityValue = Number.parseFloat(opacity);

      // Determine which pages to process
      let pagesToProcess: number[];
      if (applyToAll) {
        pagesToProcess = pages.map((_, index) => index);
      } else {
        pagesToProcess = parsePageSelection(selectedPages);
      }

      for (const pageIndex of pagesToProcess) {
        if (pageIndex >= 0 && pageIndex < pages.length) {
          const page = pages[pageIndex];
          const { width, height } = page.getSize();
          const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
          const textHeight = fontSize;

          let x, y;

          // Calculate position
          switch (position) {
            case "top":
              x = width / 2 - textWidth / 2;
              y = height - 100;
              break;
            case "bottom":
              x = width / 2 - textWidth / 2;
              y = 100;
              break;
            case "top-left":
              x = 50;
              y = height - 100;
              break;
            case "top-right":
              x = width - textWidth - 50;
              y = height - 100;
              break;
            case "bottom-left":
              x = 50;
              y = 100;
              break;
            case "bottom-right":
              x = width - textWidth - 50;
              y = 100;
              break;
            case "diagonal":
              // Diagonal watermark across the page with rotation
              const angleInRadians = -45 * (Math.PI / 180); // Convert -45 degrees to radians

              // Create multiple watermarks along the diagonal
              for (let i = -2; i <= 2; i++) {
                const centerX = width / 2 + i * 200;
                const centerY = height / 2 + i * 200;

                page.drawText(watermarkText, {
                  x: centerX,
                  y: centerY,
                  size: fontSize,
                  font,
                  color: rgb(0.5, 0.5, 0.5),
                  opacity: opacityValue,
                  rotate: angleInRadians as unknown as Rotation,
                });
              }
              continue; // Skip the regular drawing for diagonal
            default: // center
              x = width / 2 - textWidth / 2;
              y = height / 2 - textHeight / 2;
          }

          if (position !== "diagonal") {
            page.drawText(watermarkText, {
              x,
              y,
              size: fontSize,
              font,
              color: rgb(0.5, 0.5, 0.5),
              opacity: opacityValue,
            });
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      setProcessedUrl(url);
    } catch (error) {
      console.error("Error adding watermark:", error);
      alert("Failed to add watermark. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedUrl) return;
    const link = document.createElement("a");
    link.href = processedUrl;
    link.download = "watermarked.pdf";
    link.click();
  };

  const resetAll = () => {
    setFiles([]);
    setProcessedUrl(null);
    setWatermarkText("");
    setOpacity("0.3");
    setPosition("center");
    setApplyToAll(true);
    setSelectedPages("1");
    setTotalPages(0);
  };

  return (
    <ToolLayout
      title="Watermark PDF"
      description="Add watermark text to your PDF with flexible page selection"
      icon={<Droplet className="w-8 h-8" />}
      files={files}
      onFilesChange={handleFileSelected}
      acceptedFileTypes=".pdf"
      maxFiles={1}
      showUpload={true}
    >
      {files.length > 0 && !processedUrl && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="watermark">Watermark Text</Label>
            <Input
              id="watermark"
              placeholder="Enter watermark text..."
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top">Top Center</SelectItem>
                <SelectItem value="bottom">Bottom Center</SelectItem>
                <SelectItem value="top-left">Top Left</SelectItem>
                <SelectItem value="top-right">Top Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="diagonal">Diagonal Pattern</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="opacity">Opacity</Label>
            <Select value={opacity} onValueChange={setOpacity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.1">10% - Very Light</SelectItem>
                <SelectItem value="0.2">20% - Light</SelectItem>
                <SelectItem value="0.3">30% - Medium Light</SelectItem>
                <SelectItem value="0.5">50% - Medium</SelectItem>
                <SelectItem value="0.7">70% - Strong</SelectItem>
                <SelectItem value="0.9">90% - Very Strong</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <Label htmlFor="applyToAll" className="text-base">
                Apply to all pages
              </Label>
              <Switch
                id="applyToAll"
                checked={applyToAll}
                onCheckedChange={setApplyToAll}
              />
            </div>

            {!applyToAll && (
              <div className="space-y-2">
                <Label htmlFor="selectedPages">
                  Select pages ({totalPages} total pages)
                </Label>
                <Input
                  id="selectedPages"
                  placeholder="e.g., 1,3,5 or 1-5 or 1,3-5,8"
                  value={selectedPages}
                  onChange={(e) => setSelectedPages(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Enter page numbers: single (1), range (1-5), or combination
                  (1,3-5,8)
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Examples:</div>
                  <div>"1" - only page 1</div>
                  <div>"1,3,5" - pages 1, 3, and 5</div>
                  <div>"1-5" - pages 1 through 5</div>
                  <div>"1,3-5,8" - pages 1, 3, 4, 5, and 8</div>
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleProcess}
            disabled={
              processing ||
              !watermarkText ||
              (!applyToAll && !selectedPages.trim())
            }
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding Watermark...
              </>
            ) : (
              "Add Watermark"
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
            Watermark Added Successfully!
          </h3>
          <p className="text-muted-foreground mb-6">
            Your watermarked PDF is ready to download.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleDownload} size="lg">
              <Download className="w-4 h-4 mr-2" />
              Download Watermarked PDF
            </Button>
            <Button variant="outline" onClick={resetAll} size="lg">
              Add Another Watermark
            </Button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};

export default WatermarkWrapper;
