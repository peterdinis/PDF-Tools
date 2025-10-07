"use client";

import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, ImageIcon } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import ToolLayout from "@/components/tools/ToolLayout";
import PdfUpload from "../PdfUpload";

// Set up PDF.js worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

const PdfToJpgWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [images, setImages] = useState<{ url: string; name: string }[]>([]);

  const handleConvert = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const imageResults: { url: string; name: string }[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport, canvas }).promise;

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.95);
        });

        const url = URL.createObjectURL(blob);
        imageResults.push({ url, name: `page-${pageNum}.jpg` });
      }

      setImages(imageResults);
    } catch (error) {
      console.error("[v0] Error converting PDF to JPG:", error);
      alert("Failed to convert PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
  };

  const handleDownloadAll = () => {
    images.forEach(({ url, name }) => {
      setTimeout(() => handleDownload(url, name), 100);
    });
  };

  return (
    <ToolLayout
      title="PDF to JPG"
      showUpload={true}
      description="Convert each PDF page into a JPG image. High-quality conversion in seconds."
    >
      <Card>
        <CardContent className="p-6">
          {images.length === 0 ? (
            <>
              <PdfUpload onFilesSelected={setFiles} multiple={false} />

              {files.length > 0 && (
                <div className="mt-6">
                  <Button
                    onClick={handleConvert}
                    disabled={isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? "Converting..." : "Convert to JPG"}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Conversion Complete!
                </h3>
                <p className="text-muted-foreground mb-4">
                  {images.length} images created
                </p>
                <Button onClick={handleDownloadAll} size="lg">
                  <Download className="w-4 h-4 mr-2" />
                  Download All Images
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="space-y-2">
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden border bg-secondary">
                      <img
                        src={image.url || "/placeholder.svg"}
                        alt={image.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      onClick={() => handleDownload(image.url, image.name)}
                    >
                      <Download className="w-3 h-3 mr-2" />
                      {image.name}
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setFiles([]);
                  setImages([]);
                }}
                className="w-full"
              >
                Convert Another PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </ToolLayout>
  );
};

export default PdfToJpgWrapper;
