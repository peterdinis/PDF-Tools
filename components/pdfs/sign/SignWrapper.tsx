"use client";

import { useState, useRef, useEffect, FC, type MouseEvent } from "react";
import { PenTool, Download, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PDFDocument } from "pdf-lib";
import ToolLayout from "@/components/tools/ToolLayout";

const SignWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const startDrawing = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = async () => {
    if (files.length === 0 || !hasSignature) return;

    setSigning(true);

    try {
      const pdfBytes = await files[0].arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const signatureDataUrl = canvas.toDataURL("image/png");
      const signatureImageBytes = await fetch(signatureDataUrl).then((res) =>
        res.arrayBuffer(),
      );
      const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];
      const { width, height } = lastPage.getSize();

      const signatureWidth = 150;
      const signatureHeight = 50;

      lastPage.drawImage(signatureImage, {
        x: width - signatureWidth - 50,
        y: 50,
        width: signatureWidth,
        height: signatureHeight,
      });

      const signedPdfBytes = await pdfDoc.save();
      const blob = new Blob([signedPdfBytes as unknown as BlobPart], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);

      setSignedPdfUrl(url);
      setSigned(true);
    } catch (error) {
      console.error("Error signing PDF:", error);
      alert("Failed to sign PDF. Please try again.");
    } finally {
      setSigning(false);
    }
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = signedPdfUrl;
    a.download = `signed-${files[0].name}`;
    a.click();
  };

  return (
    <ToolLayout
      title="Sign PDF"
      description="Add your signature to PDF documents"
      icon={<PenTool className="w-8 h-8" />}
      files={files}
      onFilesChange={setFiles}
      acceptedFileTypes=".pdf"
      maxFiles={1}
      showUpload={true}
    >
      {files.length > 0 && !signed && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Draw your signature</label>
              <Button variant="outline" size="sm" onClick={clearSignature}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              className="border-2 border-dashed border-muted rounded-lg cursor-crosshair bg-white w-full"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
            <p className="text-sm text-muted-foreground">
              Draw your signature with your mouse or touchpad
            </p>
          </div>
          <Button
            onClick={handleSign}
            disabled={signing || !hasSignature}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            {signing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing...
              </>
            ) : (
              "Sign PDF"
            )}
          </Button>
        </div>
      )}

      {signed && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              PDF signed successfully!
            </p>
            <p className="text-sm text-green-700 mt-1">
              Your signature has been added to the last page
            </p>
          </div>
          <Button
            onClick={handleDownload}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Signed PDF
          </Button>
        </div>
      )}
    </ToolLayout>
  );
};

export default SignWrapper;
