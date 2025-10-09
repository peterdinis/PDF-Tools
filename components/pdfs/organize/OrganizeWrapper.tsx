"use client";

import { useState, useEffect, FC } from "react";
import { LayoutGrid, Download, Loader2, Trash2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PDFDocument, RotationTypes } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import ToolLayout from "@/components/tools/ToolLayout";

// Set worker path
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface PagePreview {
  pageNumber: number;
  imageUrl: string;
  rotation: number;
  deleted: boolean;
}

const OrganizeWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (files.length > 0) {
      loadPdfPages();
    }
  }, [files]);

  const loadPdfPages = async () => {
    setLoading(true);
    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pagePromises: Promise<PagePreview>[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        pagePromises.push(
          (async () => {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 0.5 });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d")!;
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // ✅ přidán canvas, aby to odpovídalo RenderParameters
            await page.render({
              canvasContext: context,
              viewport,
              canvas,
            }).promise;

            const imageUrl = canvas.toDataURL();

            return {
              pageNumber: i,
              imageUrl,
              rotation: 0,
              deleted: false,
            };
          })(),
        );
      }

      const loadedPages = await Promise.all(pagePromises);
      setPages(loadedPages);
    } catch (error) {
      console.error("Error loading PDF pages:", error);
      alert("Failed to load PDF pages. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRotatePage = (index: number) => {
    setPages((prev) =>
      prev.map((page, i) =>
        i === index ? { ...page, rotation: (page.rotation + 90) % 360 } : page,
      ),
    );
  };

  const handleDeletePage = (index: number) => {
    setPages((prev) =>
      prev.map((page, i) =>
        i === index ? { ...page, deleted: !page.deleted } : page,
      ),
    );
  };

  const handleProcess = async () => {
    if (files.length === 0) return;

    setProcessing(true);
    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      for (let i = 0; i < pages.length; i++) {
        const pageInfo = pages[i];
        if (pageInfo.deleted) continue;

        const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);

        if (pageInfo.rotation !== 0) {
          copiedPage.setRotation({
            angle: pageInfo.rotation as 0 | 90 | 180 | 270,
            type: RotationTypes.Degrees,
          });
        }

        newPdf.addPage(copiedPage);
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      setProcessedUrl(url);
    } catch (error) {
      console.error("Error organizing PDF:", error);
      alert("Failed to organize PDF. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedUrl) return;
    const link = document.createElement("a");
    link.href = processedUrl;
    link.download = "organized.pdf";
    link.click();
  };

  return (
    <ToolLayout
      title="Organize PDF"
      description="Reorder, delete, and rotate PDF pages"
      icon={<LayoutGrid className="w-8 h-8" />}
      files={files}
      onFilesChange={setFiles}
      acceptedFileTypes=".pdf"
      maxFiles={1}
      showUpload={true}
    >
      {files.length > 0 && !processedUrl && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {pages.map((page, index) => (
                  <div
                    key={index}
                    className={`relative border rounded-lg p-2 ${page.deleted ? "opacity-50 bg-red-50" : "bg-white"}`}
                  >
                    <img
                      src={page.imageUrl || "/placeholder.svg"}
                      alt={`Page ${page.pageNumber}`}
                      className="w-full h-auto"
                      style={{ transform: `rotate(${page.rotation}deg)` }}
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={() => handleRotatePage(index)}
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant={page.deleted ? "default" : "destructive"}
                        className="h-8 w-8"
                        onClick={() => handleDeletePage(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-center text-sm mt-2">
                      Page {page.pageNumber}
                    </p>
                  </div>
                ))}
              </div>
              <Button
                onClick={handleProcess}
                disabled={processing || pages.every((p) => p.deleted)}
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Organizing...
                  </>
                ) : (
                  "Apply Changes"
                )}
              </Button>
            </>
          )}
        </div>
      )}

      {processedUrl && (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Download className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            PDF Organized Successfully!
          </h3>
          <p className="text-muted-foreground mb-6">
            Your organized PDF is ready to download.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleDownload} size="lg">
              <Download className="w-4 h-4 mr-2" />
              Download Organized PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFiles([]);
                setProcessedUrl(null);
                setPages([]);
              }}
              size="lg"
            >
              Organize Another PDF
            </Button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};

export default OrganizeWrapper;
