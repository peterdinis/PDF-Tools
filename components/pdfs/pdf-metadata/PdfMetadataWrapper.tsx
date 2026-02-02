"use client";

import { FC, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileEdit, Loader2, AlertCircle, X } from "lucide-react";
import { downloadFromUrl } from "@/lib/download";
import { PDFDocument } from "pdf-lib";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ToolLayout from "@/components/tools/ToolLayout";
import PdfUpload from "../PdfUpload";

interface Metadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
}

const PdfMetadataWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [modifiedPdf, setModifiedPdf] = useState<{ url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [metadata, setMetadata] = useState<Metadata>({
    title: "",
    author: "",
    subject: "",
    keywords: "",
    creator: "",
    producer: "",
  });

  const handleFileSelected = async (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setError(null);
    setModifiedPdf(null);

    if (selectedFiles.length > 0) {
      setIsLoadingMetadata(true);
      try {
        const file = selectedFiles[0];
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);

        setMetadata({
          title: pdfDoc.getTitle() || "",
          author: pdfDoc.getAuthor() || "",
          subject: pdfDoc.getSubject() || "",
          keywords: (pdfDoc.getKeywords() || []).join(", "),
          creator: pdfDoc.getCreator() || "",
          producer: pdfDoc.getProducer() || "",
        });
      } catch (err) {
        console.error("Error loading metadata:", err);
      } finally {
        setIsLoadingMetadata(false);
      }
    }
  };

  const handleMetadataChange = (field: keyof Metadata, value: string) => {
    setMetadata((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdate = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const file = files[0];
      if (file.size > 50 * 1024 * 1024) {
        throw new Error("File size too large. Maximum size is 50MB.");
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      // Update metadata
      if (metadata.title) pdfDoc.setTitle(metadata.title);
      if (metadata.author) pdfDoc.setAuthor(metadata.author);
      if (metadata.subject) pdfDoc.setSubject(metadata.subject);
      if (metadata.keywords) {
        const keywords = metadata.keywords
          .split(",")
          .map((k) => k.trim())
          .filter((k) => k.length > 0);
        pdfDoc.setKeywords(keywords);
      }
      if (metadata.creator) pdfDoc.setCreator(metadata.creator);
      if (metadata.producer) pdfDoc.setProducer(metadata.producer);

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);

      setModifiedPdf({ url });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update PDF metadata. Please try again.";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!modifiedPdf) return;

    setIsDownloading(true);
    try {
      const filename = `metadata_updated_${Date.now()}.pdf`;
      const success = await downloadFromUrl(modifiedPdf.url, filename);

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
    setModifiedPdf(null);
    setError(null);
    setMetadata({
      title: "",
      author: "",
      subject: "",
      keywords: "",
      creator: "",
      producer: "",
    });
  };

  return (
    <ToolLayout
      title="PDF Metadata Editor"
      showUpload={true}
      description="Edit PDF metadata including title, author, subject, keywords, and more."
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

          {!modifiedPdf ? (
            <>
              <PdfUpload
                onFilesSelected={handleFileSelected}
                multiple={false}
              />

              {files.length > 0 && (
                <div className="mt-6 space-y-4">
                  {isLoadingMetadata ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="ml-2 text-muted-foreground">
                        Loading metadata...
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="title">Title</Label>
                          <Input
                            id="title"
                            value={metadata.title}
                            onChange={(e) =>
                              handleMetadataChange("title", e.target.value)
                            }
                            placeholder="Document title"
                          />
                        </div>

                        <div>
                          <Label htmlFor="author">Author</Label>
                          <Input
                            id="author"
                            value={metadata.author}
                            onChange={(e) =>
                              handleMetadataChange("author", e.target.value)
                            }
                            placeholder="Author name"
                          />
                        </div>

                        <div>
                          <Label htmlFor="subject">Subject</Label>
                          <Input
                            id="subject"
                            value={metadata.subject}
                            onChange={(e) =>
                              handleMetadataChange("subject", e.target.value)
                            }
                            placeholder="Document subject"
                          />
                        </div>

                        <div>
                          <Label htmlFor="keywords">
                            Keywords (comma-separated)
                          </Label>
                          <Input
                            id="keywords"
                            value={metadata.keywords}
                            onChange={(e) =>
                              handleMetadataChange("keywords", e.target.value)
                            }
                            placeholder="keyword1, keyword2, keyword3"
                          />
                        </div>

                        <div>
                          <Label htmlFor="creator">Creator</Label>
                          <Input
                            id="creator"
                            value={metadata.creator}
                            onChange={(e) =>
                              handleMetadataChange("creator", e.target.value)
                            }
                            placeholder="Application that created the PDF"
                          />
                        </div>

                        <div>
                          <Label htmlFor="producer">Producer</Label>
                          <Input
                            id="producer"
                            value={metadata.producer}
                            onChange={(e) =>
                              handleMetadataChange("producer", e.target.value)
                            }
                            placeholder="Application that produced the PDF"
                          />
                        </div>
                      </div>

                      <Button
                        onClick={handleUpdate}
                        disabled={isProcessing}
                        className="w-full"
                        size="lg"
                      >
                        {isProcessing ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Updating metadata...
                          </div>
                        ) : (
                          <>
                            <FileEdit className="w-4 h-4 mr-2" />
                            Update Metadata
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <FileEdit className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Metadata Updated Successfully!
              </h3>
              <p className="text-muted-foreground mb-6">
                Your PDF metadata has been updated. Download the file to save
                your changes.
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
                      Download PDF
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleReset} size="lg">
                  Edit Another PDF
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </ToolLayout>
  );
};

export default PdfMetadataWrapper;
