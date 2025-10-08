"use client";

import { useState, useRef, useEffect, FC, type MouseEvent } from "react";
import { PenTool, Download, Loader2, Trash2, Type, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import ToolLayout from "@/components/tools/ToolLayout";

type SignatureType = "draw" | "type" | "upload";
type SignaturePosition =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left"
  | "custom";

const SignWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string>("");
  const [signatureType, setSignatureType] = useState<SignatureType>("draw");
  const [signaturePosition, setSignaturePosition] =
    useState<SignaturePosition>("bottom-right");
  const [customX, setCustomX] = useState("50");
  const [customY, setCustomY] = useState("50");
  const [selectedPage, setSelectedPage] = useState<number>(1);

  // Drawing signature
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Typed signature
  const [typedSignature, setTypedSignature] = useState("");
  const [fontSize, setFontSize] = useState("24");
  const [fontFamily, setFontFamily] = useState("Helvetica");

  // Uploaded signature
  const [uploadedSignature, setUploadedSignature] = useState<File | null>(null);

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
    if (signatureType === "draw") {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    } else if (signatureType === "type") {
      setTypedSignature("");
    } else if (signatureType === "upload") {
      setUploadedSignature(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setUploadedSignature(file);
    }
  };

  const getSignatureImage = async (): Promise<Uint8Array | null> => {
    if (signatureType === "draw") {
      const canvas = canvasRef.current;
      if (!canvas || !hasSignature) return null;

      const signatureDataUrl = canvas.toDataURL("image/png");
      const signatureImageBytes = await fetch(signatureDataUrl).then((res) =>
        res.arrayBuffer(),
      );
      return new Uint8Array(signatureImageBytes);
    } else if (signatureType === "upload" && uploadedSignature) {
      const signatureImageBytes = await uploadedSignature.arrayBuffer();
      return new Uint8Array(signatureImageBytes);
    }
    return null;
  };

  const getPosition = (pageWidth: number, pageHeight: number) => {
    const margin = 50;
    const signatureWidth = 150;
    const signatureHeight = 50;

    switch (signaturePosition) {
      case "bottom-right":
        return { x: pageWidth - signatureWidth - margin, y: margin };
      case "bottom-left":
        return { x: margin, y: margin };
      case "top-right":
        return {
          x: pageWidth - signatureWidth - margin,
          y: pageHeight - signatureHeight - margin,
        };
      case "top-left":
        return { x: margin, y: pageHeight - signatureHeight - margin };
      case "custom":
        return {
          x: Number.parseInt(customX),
          y: Number.parseInt(customY),
        };
      default:
        return { x: pageWidth - signatureWidth - margin, y: margin };
    }
  };

  const handleSign = async () => {
    if (files.length === 0) return;

    // Validation based on signature type
    if (signatureType === "draw" && !hasSignature) return;
    if (signatureType === "type" && !typedSignature.trim()) return;
    if (signatureType === "upload" && !uploadedSignature) return;

    setSigning(true);

    try {
      const pdfBytes = await files[0].arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);

      const pages = pdfDoc.getPages();
      const totalPages = pages.length;

      // Validate selected page
      const pageIndex = Math.min(Math.max(selectedPage - 1, 0), totalPages - 1);
      const targetPage = pages[pageIndex];
      const { width, height } = targetPage.getSize();

      if (signatureType === "type") {
        // Handle typed signature
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontSizeNum = Number.parseInt(fontSize);

        targetPage.drawText(typedSignature, {
          x: getPosition(width, height).x,
          y: getPosition(width, height).y,
          size: fontSizeNum,
          font: font,
          color: rgb(0, 0, 0),
        });
      } else {
        // Handle image-based signatures (draw or upload)
        const signatureImageBytes = await getSignatureImage();
        if (!signatureImageBytes) return;

        let signatureImage;
        if (
          signatureType === "upload" &&
          uploadedSignature?.type === "image/png"
        ) {
          signatureImage = await pdfDoc.embedPng(signatureImageBytes);
        } else {
          signatureImage = await pdfDoc.embedPng(signatureImageBytes);
        }

        const signatureWidth = 150;
        const signatureHeight = 50;

        targetPage.drawImage(signatureImage, {
          x: getPosition(width, height).x,
          y: getPosition(width, height).y,
          width: signatureWidth,
          height: signatureHeight,
        });
      }

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

  const resetAll = () => {
    setFiles([]);
    setSigned(false);
    setSignedPdfUrl("");
    setSignatureType("draw");
    setSignaturePosition("bottom-right");
    setCustomX("50");
    setCustomY("50");
    setSelectedPage(1);
    setTypedSignature("");
    setUploadedSignature(null);
    clearSignature();
  };

  const isSignatureReady = () => {
    switch (signatureType) {
      case "draw":
        return hasSignature;
      case "type":
        return typedSignature.trim().length > 0;
      case "upload":
        return uploadedSignature !== null;
      default:
        return false;
    }
  };

  return (
    <ToolLayout
      title="Sign PDF"
      description="Add your signature to PDF documents using multiple methods"
      icon={<PenTool className="w-8 h-8" />}
      files={files}
      onFilesChange={setFiles}
      acceptedFileTypes=".pdf"
      maxFiles={1}
      showUpload={true}
    >
      {files.length > 0 && !signed && (
        <div className="space-y-6">
          {/* Signature Type Selection */}
          <Card>
            <CardContent className="p-4">
              <Tabs
                value={signatureType}
                onValueChange={(value) =>
                  setSignatureType(value as SignatureType)
                }
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="draw">
                    <PenTool className="w-4 h-4 mr-2" />
                    Draw
                  </TabsTrigger>
                  <TabsTrigger value="type">
                    <Type className="w-4 h-4 mr-2" />
                    Type
                  </TabsTrigger>
                  <TabsTrigger value="upload">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </TabsTrigger>
                </TabsList>

                {/* Draw Signature Tab */}
                <TabsContent value="draw" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Draw your signature</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearSignature}
                      >
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
                </TabsContent>

                {/* Type Signature Tab */}
                <TabsContent value="type" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Type your signature</Label>
                    <Textarea
                      placeholder="Enter your signature..."
                      value={typedSignature}
                      onChange={(e) => setTypedSignature(e.target.value)}
                      className="min-h-20 text-2xl font-signature"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Font Size</Label>
                      <Input
                        type="number"
                        min="12"
                        max="48"
                        value={fontSize}
                        onChange={(e) => setFontSize(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Font</Label>
                      <Select value={fontFamily} onValueChange={setFontFamily}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Helvetica-Bold">
                            Helvetica Bold
                          </SelectItem>
                          <SelectItem value="Times-Roman">
                            Times New Roman
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                {/* Upload Signature Tab */}
                <TabsContent value="upload" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Upload signature image</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    {uploadedSignature && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {uploadedSignature.name}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Upload a PNG or JPG image of your signature
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Signature Position Settings */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Page Number</Label>
                  <Input
                    type="number"
                    min="1"
                    value={selectedPage}
                    onChange={(e) =>
                      setSelectedPage(Number.parseInt(e.target.value))
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Which page to sign (1 to {files[0] ? "?" : "1"})
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Signature Position</Label>
                  <Select
                    value={signaturePosition}
                    onValueChange={(value) =>
                      setSignaturePosition(value as SignaturePosition)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="top-left">Top Left</SelectItem>
                      <SelectItem value="custom">Custom Position</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {signaturePosition === "custom" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>X Position</Label>
                      <Input
                        type="number"
                        value={customX}
                        onChange={(e) => setCustomX(e.target.value)}
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Y Position</Label>
                      <Input
                        type="number"
                        value={customY}
                        onChange={(e) => setCustomY(e.target.value)}
                        min="0"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sign Button */}
          <Button
            onClick={handleSign}
            disabled={signing || !isSignatureReady()}
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
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Download className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            PDF Signed Successfully!
          </h3>
          <p className="text-muted-foreground mb-6">
            Your signature has been added to the document.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleDownload} size="lg">
              <Download className="w-4 h-4 mr-2" />
              Download Signed PDF
            </Button>
            <Button variant="outline" onClick={resetAll} size="lg">
              Sign Another PDF
            </Button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};

export default SignWrapper;
