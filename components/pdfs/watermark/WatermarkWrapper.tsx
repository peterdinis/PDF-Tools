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
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import ToolLayout from "@/components/tools/ToolLayout";

const WatermarkWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [watermarkText, setWatermarkText] = useState("");
  const [opacity, setOpacity] = useState("0.3");
  const [position, setPosition] = useState("center");

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

      for (const page of pages) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
        const textHeight = fontSize;

        const x = width / 2 - textWidth / 2;
        let y = height / 2 - textHeight / 2;

        if (position === "top") {
          y = height - 100;
        } else if (position === "bottom") {
          y = 50;
        }

        page.drawText(watermarkText, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.5, 0.5, 0.5),
          opacity: opacityValue,
        });
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

  return (
    <ToolLayout
      title="Watermark PDF"
      description="Add watermark text to your PDF"
      icon={<Droplet className="w-8 h-8" />}
      files={files}
      onFilesChange={setFiles}
      acceptedFileTypes=".pdf"
      maxFiles={1}
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
                <SelectItem value="top">Top</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="bottom">Bottom</SelectItem>
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
                <SelectItem value="0.1">10%</SelectItem>
                <SelectItem value="0.3">30%</SelectItem>
                <SelectItem value="0.5">50%</SelectItem>
                <SelectItem value="0.7">70%</SelectItem>
                <SelectItem value="1.0">100%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleProcess}
            disabled={processing || !watermarkText}
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
            <Button
              variant="outline"
              onClick={() => {
                setFiles([]);
                setProcessedUrl(null);
                setWatermarkText("");
              }}
              size="lg"
            >
              Add Another Watermark
            </Button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};

export default WatermarkWrapper;
