"use client";

import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, RotateCw } from "lucide-react";
import { PDFDocument, degrees } from "pdf-lib";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ToolLayout from "@/components/tools/ToolLayout";
import PdfUpload from "../PdfUpload";

type RotationAngle = 90 | 180 | 270;

const RotateWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rotatedPdf, setRotatedPdf] = useState<string | null>(null);
  const [rotationAngle, setRotationAngle] = useState<RotationAngle>(90);

  const handleRotate = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    try {
      const arrayBuffer = await files[0].arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      pages.forEach((page) => {
        page.setRotation(degrees(rotationAngle));
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      setRotatedPdf(url);
    } catch (error) {
      console.error("[v0] Error rotating PDF:", error);
      alert("Failed to rotate PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!rotatedPdf) return;
    const link = document.createElement("a");
    link.href = rotatedPdf;
    link.download = "rotated.pdf";
    link.click();
  };

  return (
    <ToolLayout
      title="Rotate PDF"
      showUpload={true}
      description="Rotate all pages in your PDF document. Choose the rotation angle and apply it to your entire PDF."
    >
      <Card>
        <CardContent className="p-6">
          {!rotatedPdf ? (
            <>
              <PdfUpload onFilesSelected={setFiles} multiple={false} />

              {files.length > 0 && (
                <div className="mt-6 space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      Rotation Angle
                    </Label>
                    <RadioGroup
                      value={rotationAngle.toString()}
                      onValueChange={(value) =>
                        setRotationAngle(
                          Number.parseInt(value) as RotationAngle,
                        )
                      }
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="90" id="90" />
                        <Label
                          htmlFor="90"
                          className="font-normal cursor-pointer"
                        >
                          90° clockwise
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="180" id="180" />
                        <Label
                          htmlFor="180"
                          className="font-normal cursor-pointer"
                        >
                          180° (upside down)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="270" id="270" />
                        <Label
                          htmlFor="270"
                          className="font-normal cursor-pointer"
                        >
                          270° clockwise (90° counter-clockwise)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="p-4 bg-secondary rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <RotateCw className="w-12 h-12 text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        All pages will be rotated {rotationAngle}°
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleRotate}
                    disabled={isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? "Rotating..." : "Rotate PDF"}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <RotateCw className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                PDF Rotated Successfully!
              </h3>
              <p className="text-muted-foreground mb-6">
                Your rotated PDF is ready to download.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleDownload} size="lg">
                  <Download className="w-4 h-4 mr-2" />
                  Download Rotated PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFiles([]);
                    setRotatedPdf(null);
                  }}
                  size="lg"
                >
                  Rotate Another PDF
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </ToolLayout>
  );
};

export default RotateWrapper;
