"use client";

import { FC, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, RotateCw, Eye, EyeOff, Undo2 } from "lucide-react";
import { PDFDocument, degrees } from "pdf-lib";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ToolLayout from "@/components/tools/ToolLayout";
import PdfUpload from "../PdfUpload";

type RotationAngle = 90 | 180 | 270;

const RotateWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rotatedPdf, setRotatedPdf] = useState<string | null>(null);
  const [rotationAngle, setRotationAngle] = useState<RotationAngle>(90);
  const [activeTab, setActiveTab] = useState<"original" | "preview">(
    "original",
  );
  const [showPreview, setShowPreview] = useState(false);
  const [currentRotation, setCurrentRotation] = useState<RotationAngle>(90);

  const originalIframeRef = useRef<HTMLIFrameElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  const generatePreview = async (angle: RotationAngle = rotationAngle) => {
    if (files.length === 0) return;

    try {
      const arrayBuffer = await files[0].arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      pages.forEach((page) => {
        page.setRotation(degrees(angle));
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], {
        type: "application/pdf",
      });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error generating preview:", error);
      return null;
    }
  };

  const handlePreview = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    try {
      const previewUrl = await generatePreview();
      if (previewUrl) {
        setShowPreview(true);
        setActiveTab("preview");

        // Update preview iframe
        if (previewIframeRef.current) {
          previewIframeRef.current.src = previewUrl;
        }
      }
    } catch (error) {
      console.error("Error generating preview:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAngleChange = async (angle: RotationAngle) => {
    setRotationAngle(angle);

    // Regenerate preview if preview is already shown
    if (showPreview) {
      setIsProcessing(true);
      try {
        const previewUrl = await generatePreview(angle);
        if (previewUrl && previewIframeRef.current) {
          previewIframeRef.current.src = previewUrl;
        }
      } catch (error) {
        console.error("Error updating preview:", error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleRotate = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    try {
      const rotatedUrl = await generatePreview();
      if (rotatedUrl) {
        setRotatedPdf(rotatedUrl);
        setCurrentRotation(rotationAngle);
      }
    } catch (error) {
      console.error("Error rotating PDF:", error);
      alert("Failed to rotate PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTryDifferentAngle = () => {
    // Reset to editing mode but keep the file
    setRotatedPdf(null);
    setShowPreview(true);
    setActiveTab("preview");
  };

  const handleDownload = () => {
    if (!rotatedPdf) return;
    const link = document.createElement("a");
    link.href = rotatedPdf;
    link.download = `rotated_${currentRotation}deg.pdf`;
    link.click();
  };

  const resetAll = () => {
    setFiles([]);
    setRotatedPdf(null);
    setRotationAngle(90);
    setCurrentRotation(90);
    setActiveTab("original");
    setShowPreview(false);
  };

  const quickRotate = async (angle: RotationAngle) => {
    if (!rotatedPdf) return;

    setIsProcessing(true);
    try {
      const arrayBuffer = await files[0].arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      pages.forEach((page) => {
        page.setRotation(degrees(angle));
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);

      setRotatedPdf(url);
      setCurrentRotation(angle);
      setRotationAngle(angle);
    } catch (error) {
      console.error("Error rotating PDF:", error);
      alert("Failed to rotate PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout
      title="Rotate PDF"
      showUpload={true}
      description="Rotate all pages in your PDF document with live preview. Choose the rotation angle and see the result before applying."
    >
      <Card>
        <CardContent className="p-6">
          {!rotatedPdf ? (
            <>
              <PdfUpload onFilesSelected={setFiles} multiple={false} />

              {files.length > 0 && (
                <div className="mt-6 space-y-6">
                  {/* Preview Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">
                        Document Preview
                      </Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreview}
                        disabled={isProcessing}
                      >
                        {showPreview ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Hide Preview
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Show Preview
                          </>
                        )}
                      </Button>
                    </div>

                    {showPreview && (
                      <Tabs
                        value={activeTab}
                        onValueChange={(value) =>
                          setActiveTab(value as "original" | "preview")
                        }
                      >
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="original">Original</TabsTrigger>
                          <TabsTrigger value="preview">
                            Preview ({rotationAngle}°)
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="original" className="space-y-2">
                          <div className="border rounded-lg h-64 overflow-hidden">
                            <iframe
                              ref={originalIframeRef}
                              src={URL.createObjectURL(files[0])}
                              className="w-full h-full"
                              title="Original PDF"
                            />
                          </div>
                          <p className="text-sm text-muted-foreground text-center">
                            Original document
                          </p>
                        </TabsContent>

                        <TabsContent value="preview" className="space-y-2">
                          <div className="border rounded-lg h-64 overflow-hidden">
                            {isProcessing ? (
                              <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                  <RotateCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                                  <p className="text-sm text-muted-foreground">
                                    Generating preview...
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <iframe
                                ref={previewIframeRef}
                                className="w-full h-full"
                                title="Rotated PDF Preview"
                              />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground text-center">
                            Preview with {rotationAngle}° rotation
                          </p>
                        </TabsContent>
                      </Tabs>
                    )}

                    {!showPreview && (
                      <div className="border-2 border-dashed border-muted rounded-lg h-32 flex items-center justify-center">
                        <div className="text-center">
                          <Eye className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Click "Show Preview" to see the rotation effect
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rotation Settings */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      Rotation Angle
                    </Label>
                    <RadioGroup
                      value={rotationAngle.toString()}
                      onValueChange={(value) =>
                        handleAngleChange(
                          Number.parseInt(value) as RotationAngle,
                        )
                      }
                    >
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center space-y-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
                          <RadioGroupItem
                            value="90"
                            id="90"
                            className="sr-only"
                          />
                          <Label
                            htmlFor="90"
                            className="font-normal cursor-pointer flex flex-col items-center text-center"
                          >
                            <div className="w-12 h-12 border-2 border-primary rounded-lg flex items-center justify-center mb-2">
                              <RotateCw className="w-6 h-6" />
                            </div>
                            90° clockwise
                          </Label>
                        </div>

                        <div className="flex flex-col items-center space-y-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
                          <RadioGroupItem
                            value="180"
                            id="180"
                            className="sr-only"
                          />
                          <Label
                            htmlFor="180"
                            className="font-normal cursor-pointer flex flex-col items-center text-center"
                          >
                            <div className="w-12 h-12 border-2 border-primary rounded-lg flex items-center justify-center mb-2">
                              <RotateCw className="w-6 h-6" />
                              <RotateCw className="w-6 h-6 -ml-2" />
                            </div>
                            180° (upside down)
                          </Label>
                        </div>

                        <div className="flex flex-col items-center space-y-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
                          <RadioGroupItem
                            value="270"
                            id="270"
                            className="sr-only"
                          />
                          <Label
                            htmlFor="270"
                            className="font-normal cursor-pointer flex flex-col items-center text-center"
                          >
                            <div className="w-12 h-12 border-2 border-primary rounded-lg flex items-center justify-center mb-2">
                              <RotateCw className="w-6 h-6 transform rotate-180" />
                            </div>
                            270° clockwise
                            <span className="text-xs text-muted-foreground">
                              (90° counter-clockwise)
                            </span>
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={handleRotate}
                    disabled={isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                        Applying Rotation...
                      </>
                    ) : (
                      <>
                        <RotateCw className="w-4 h-4 mr-2" />
                        Apply {rotationAngle}° Rotation
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-6">
              {/* Success Header */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <RotateCw className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  PDF Rotated Successfully!
                </h3>
                <p className="text-muted-foreground">
                  Your PDF has been rotated {currentRotation}° and is ready to
                  download.
                </p>
              </div>

              {/* Final Preview */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Final Result</Label>
                <div className="border rounded-lg h-64 overflow-hidden">
                  <iframe
                    src={rotatedPdf}
                    className="w-full h-full"
                    title="Final Rotated PDF"
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Current rotation: {currentRotation}°
                </p>
              </div>

              {/* Quick Rotation Options */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Try Different Angle
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => quickRotate(90)}
                    disabled={isProcessing || currentRotation === 90}
                    className="flex flex-col items-center h-auto py-3"
                  >
                    <RotateCw className="w-5 h-5 mb-1" />
                    <span className="text-xs">90°</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => quickRotate(180)}
                    disabled={isProcessing || currentRotation === 180}
                    className="flex flex-col items-center h-auto py-3"
                  >
                    <RotateCw className="w-5 h-5 mb-1" />
                    <RotateCw className="w-5 h-5 mb-1 -ml-1" />
                    <span className="text-xs">180°</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => quickRotate(270)}
                    disabled={isProcessing || currentRotation === 270}
                    className="flex flex-col items-center h-auto py-3"
                  >
                    <RotateCw className="w-5 h-5 mb-1 transform rotate-180" />
                    <span className="text-xs">270°</span>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Click to quickly apply a different rotation
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button onClick={handleDownload} className="w-full" size="lg">
                  <Download className="w-4 h-4 mr-2" />
                  Download Rotated PDF
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleTryDifferentAngle}
                    className="w-full"
                  >
                    <Undo2 className="w-4 h-4 mr-2" />
                    Edit Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetAll}
                    className="w-full"
                  >
                    New PDF
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </ToolLayout>
  );
};

export default RotateWrapper;
