"use client";

import { FC, useState, useRef } from "react";
import { ScanLine, Loader2 } from "lucide-react";
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
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `scan_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          setFiles((prev) => [...prev, file]);
        }
      }, "image/jpeg");
    }
  };

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
      description="Capture documents from camera or upload images to convert them to PDF."
      icon={<ScanLine className="w-8 h-8" />}
      files={files}
      showUpload={!cameraActive}
      onFilesChange={setFiles}
      acceptedFileTypes=".jpg,.jpeg,.png"
      maxFiles={20}
    >
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          {!cameraActive ? (
            <Button onClick={startCamera} className="w-full sm:w-auto">
              Start Camera
            </Button>
          ) : (
            <div className="w-full space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={captureImage}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Capture Page
                </Button>
                <Button onClick={stopCamera} variant="outline">
                  Close Camera
                </Button>
              </div>
            </div>
          )}
        </div>

        {files.length > 0 && (
          <>
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
                  <Label
                    htmlFor="letter"
                    className="font-normal cursor-pointer"
                  >
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

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="relative aspect-[3/4] bg-muted rounded border overflow-hidden"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Page ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() =>
                      setFiles(files.filter((_, idx) => idx !== i))
                    }
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {files.length} page{files.length !== 1 ? "s" : ""}{" "}
                scanned/selected
              </p>
            </div>

            <Button
              onClick={handleProcess}
              disabled={processing}
              className="w-full"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating PDF...
                </>
              ) : (
                "Create PDF"
              )}
            </Button>
          </>
        )}
      </div>
    </ToolLayout>
  );
};

export default ScanWrapper;
