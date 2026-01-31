"use client";

import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Upload, X, Loader2 } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import ToolLayout from "@/components/tools/ToolLayout";

const JpgToPdfWrapper: FC = () => {
  const [images, setImages] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    setImages((prev) => [...prev, ...acceptedFiles]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png"] },
    multiple: true,
  });

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (images.length === 0) return;

    setIsProcessing(true);
    try {
      const pdfDoc = await PDFDocument.create();

      for (const imageFile of images) {
        const arrayBuffer = await imageFile.arrayBuffer();
        const imageBytes = new Uint8Array(arrayBuffer);

        let image;
        if (imageFile.type === "image/png") {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          image = await pdfDoc.embedJpg(imageBytes);
        }

        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error("[v0] Error converting images to PDF:", error);
      alert("Failed to convert images. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = "images.pdf";
    link.click();
  };

  return (
    <ToolLayout
      title="JPG to PDF"
      showUpload={true}
      description="Convert JPG and PNG images to PDF. Upload multiple images and combine them into one PDF document."
    >
      <Card>
        <CardContent className="p-6">
          {!pdfUrl ? (
            <>
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-secondary/50",
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  {isDragActive ? (
                    <p className="text-lg font-medium">
                      Drop your images here...
                    </p>
                  ) : (
                    <>
                      <div>
                        <p className="text-lg font-medium mb-1">
                          Select images
                        </p>
                        <p className="text-sm text-muted-foreground">
                          or drag and drop JPG, PNG files
                        </p>
                      </div>
                      <Button type="button" variant="default">
                        Select Images
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {images.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border bg-secondary">
                          <img
                            src={
                              URL.createObjectURL(image) || "/placeholder.svg"
                            }
                            alt={image.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                          onClick={() => removeImage(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleConvert}
                    disabled={isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      `Convert ${images.length} Image${images.length > 1 ? "s" : ""} to PDF`
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                PDF Created Successfully!
              </h3>
              <p className="text-muted-foreground mb-6">
                Your PDF is ready to download.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleDownload} size="lg">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setImages([]);
                    setPdfUrl(null);
                  }}
                  size="lg"
                >
                  Convert More Images
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </ToolLayout>
  );
};

export default JpgToPdfWrapper;
