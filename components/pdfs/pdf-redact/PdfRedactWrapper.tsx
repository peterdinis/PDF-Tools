"use client";

import { FC, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Eraser, Loader2, AlertCircle, X, Square } from "lucide-react";
import { downloadFromUrl } from "@/lib/download";
import { PDFDocument, rgb } from "pdf-lib";
import ToolLayout from "@/components/tools/ToolLayout";
import PdfUpload from "../PdfUpload";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface RedactionRect {
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
}

const PdfRedactWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [redactedPdf, setRedactedPdf] = useState<{ url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [redactions, setRedactions] = useState<RedactionRect[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileSelected = async (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setError(null);
    setRedactedPdf(null);
    setRedactions([]);
    setCurrentPage(1);

    if (selectedFiles.length > 0) {
      setIsLoading(true);
      try {
        const file = selectedFiles[0];
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setPdfDoc(pdf);
        await renderPage(pdf, 1);
      } catch (err) {
        console.error("Error loading PDF:", err);
        setError("Failed to load PDF file");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderPage = async (
    pdf: pdfjsLib.PDFDocumentProxy,
    pageNum: number,
  ) => {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    // Draw existing redactions
    const pageRedactions = redactions.filter(
      (r) => r.pageIndex === pageNum - 1,
    );
    pageRedactions.forEach((rect) => {
      context.fillStyle = "rgba(0, 0, 0, 0.8)";
      context.fillRect(rect.x, rect.y, rect.width, rect.height);
    });
  };

  useEffect(() => {
    if (pdfDoc) {
      renderPage(pdfDoc, currentPage);
    }
  }, [currentPage, redactions, pdfDoc]);

  const getCanvasCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement>,
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasCoordinates(e);
    if (!pos) return;

    setIsDrawing(true);
    setStartPos(pos);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) return;

    const pos = getCanvasCoordinates(e);
    if (!pos || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    // Re-render page
    if (pdfDoc) {
      renderPage(pdfDoc, currentPage).then(() => {
        // Draw current selection
        const width = pos.x - startPos.x;
        const height = pos.y - startPos.y;
        context.strokeStyle = "rgba(255, 0, 0, 0.8)";
        context.lineWidth = 2;
        context.strokeRect(startPos.x, startPos.y, width, height);
        context.fillStyle = "rgba(255, 0, 0, 0.2)";
        context.fillRect(startPos.x, startPos.y, width, height);
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) {
      setIsDrawing(false);
      return;
    }

    const pos = getCanvasCoordinates(e);
    if (!pos) {
      setIsDrawing(false);
      return;
    }

    const width = pos.x - startPos.x;
    const height = pos.y - startPos.y;

    if (Math.abs(width) > 5 && Math.abs(height) > 5) {
      const newRedaction: RedactionRect = {
        x: Math.min(startPos.x, pos.x),
        y: Math.min(startPos.y, pos.y),
        width: Math.abs(width),
        height: Math.abs(height),
        pageIndex: currentPage - 1,
      };
      setRedactions([...redactions, newRedaction]);
    }

    setIsDrawing(false);
    setStartPos(null);
  };

  const handleRedact = async () => {
    if (files.length === 0 || redactions.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const file = files[0];
      if (file.size > 50 * 1024 * 1024) {
        throw new Error("File size too large. Maximum size is 50MB.");
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      // Group redactions by page
      const redactionsByPage = redactions.reduce(
        (acc, redaction) => {
          if (!acc[redaction.pageIndex]) {
            acc[redaction.pageIndex] = [];
          }
          acc[redaction.pageIndex].push(redaction);
          return acc;
        },
        {} as Record<number, RedactionRect[]>,
      );

      // Apply redactions to each page
      for (const [pageIndexStr, pageRedactions] of Object.entries(
        redactionsByPage,
      )) {
        const pageIndex = parseInt(pageIndexStr);
        if (pageIndex >= 0 && pageIndex < pages.length) {
          const page = pages[pageIndex];
          const { width, height } = page.getSize();

          // Get the scale factor used for rendering
          const scale = 1.5;
          const scaleX = width / (canvasRef.current?.width || width);
          const scaleY = height / (canvasRef.current?.height || height);

          pageRedactions.forEach((rect) => {
            // Convert canvas coordinates to PDF coordinates
            const pdfX = (rect.x / scale) * scaleX;
            const pdfY = height - (rect.y / scale) * scaleY - (rect.height / scale) * scaleY;
            const pdfWidth = (rect.width / scale) * scaleX;
            const pdfHeight = (rect.height / scale) * scaleY;

            // Draw black rectangle
            page.drawRectangle({
              x: pdfX,
              y: pdfY,
              width: pdfWidth,
              height: pdfHeight,
              color: rgb(0, 0, 0),
            });
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);

      setRedactedPdf({ url });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to redact PDF. Please try again.";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!redactedPdf) return;

    setIsDownloading(true);
    try {
      const filename = `redacted_${Date.now()}.pdf`;
      const success = await downloadFromUrl(redactedPdf.url, filename);

      if (!success) {
        setError("Failed to download file. Please try again.");
      }
    } catch (error) {
      setError("Failed to download file. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setRedactedPdf(null);
    setError(null);
    setPdfDoc(null);
    setRedactions([]);
    setCurrentPage(1);
  };

  const removeRedaction = (index: number) => {
    setRedactions(redactions.filter((_, i) => i !== index));
  };

  const currentPageRedactions = redactions.filter(
    (r) => r.pageIndex === currentPage - 1,
  );

  return (
    <ToolLayout
      title="PDF Redact"
      showUpload={true}
      description="Permanently remove sensitive information from PDF documents with blackout redaction."
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

          {!redactedPdf ? (
            <>
              <PdfUpload
                onFilesSelected={handleFileSelected}
                multiple={false}
              />

              {pdfDoc && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm font-medium">
                        Page {currentPage} of {pdfDoc.numPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(
                            Math.min(pdfDoc.numPages, currentPage + 1),
                          )
                        }
                        disabled={currentPage === pdfDoc.numPages}
                      >
                        Next
                      </Button>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleReset}>
                      <X className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-2">
                      Click and drag to select areas to redact
                    </p>
                    <div
                      ref={containerRef}
                      className="border rounded overflow-auto bg-white"
                      style={{ maxHeight: "600px" }}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      ) : (
                        <canvas
                          ref={canvasRef}
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          className="cursor-crosshair"
                        />
                      )}
                    </div>
                  </div>

                  {currentPageRedactions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        Redactions on this page ({currentPageRedactions.length})
                      </p>
                      <div className="space-y-1">
                        {currentPageRedactions.map((redaction, index) => {
                          const globalIndex = redactions.findIndex(
                            (r) => r === redaction,
                          );
                          return (
                            <div
                              key={globalIndex}
                              className="flex items-center justify-between p-2 bg-secondary rounded text-sm"
                            >
                              <span>
                                Redaction {globalIndex + 1} (Page{" "}
                                {redaction.pageIndex + 1})
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeRedaction(globalIndex)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={handleRedact}
                      disabled={isProcessing || redactions.length === 0}
                      className="flex-1"
                      size="lg"
                    >
                      {isProcessing ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Redacting PDF...
                        </div>
                      ) : (
                        <>
                          <Eraser className="w-4 h-4 mr-2" />
                          Apply Redactions ({redactions.length})
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Eraser className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                PDF Redacted Successfully!
              </h3>
              <p className="text-muted-foreground mb-6">
                Your PDF has been redacted. The sensitive information has been
                permanently removed.
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
                      Download Redacted PDF
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleReset} size="lg">
                  Redact Another PDF
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </ToolLayout>
  );
};

export default PdfRedactWrapper;
