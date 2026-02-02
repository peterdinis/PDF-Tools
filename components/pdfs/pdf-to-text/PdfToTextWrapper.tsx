"use client";

import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileText, Loader2, AlertCircle, Copy, Check } from "lucide-react";
import { downloadText } from "@/lib/download";
import { PDFDocument } from "pdf-lib";
import ToolLayout from "@/components/tools/ToolLayout";
import PdfUpload from "../PdfUpload";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

const PdfToTextWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleFileSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setError(null);
    setExtractedText("");
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    }

    return fullText.trim();
  };

  const handleExtract = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setExtractedText("");

    try {
      const file = files[0];
      if (file.size > 50 * 1024 * 1024) {
        throw new Error("File size too large. Maximum size is 50MB.");
      }

      const text = await extractTextFromPDF(file);
      setExtractedText(text);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to extract text from PDF. Please try again.";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!extractedText) return;

    setIsDownloading(true);
    try {
      const filename = `extracted_text_${Date.now()}.txt`;
      const success = await downloadText(extractedText, filename);

      if (!success) {
        setError("Failed to download file. Please try again.");
      }
    } catch (error) {
      setError("Failed to download file. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopy = async () => {
    if (!extractedText) return;
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setExtractedText("");
    setError(null);
  };

  return (
    <ToolLayout
      title="PDF to Text"
      showUpload={true}
      description="Extract all text content from PDF files and save it as a text document."
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

          {!extractedText ? (
            <>
              <PdfUpload
                onFilesSelected={handleFileSelected}
                multiple={false}
              />

              {files.length > 0 && (
                <div className="mt-6">
                  <Button
                    onClick={handleExtract}
                    disabled={isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Extracting text...
                      </div>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Extract Text
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Extracted Text</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    disabled={copied}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
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
                        Download
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-muted/50 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {extractedText}
                </pre>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleDownload}
                  size="lg"
                  className="flex-1"
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
                      Download as TXT
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleReset} size="lg">
                  Extract Another PDF
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </ToolLayout>
  );
};

export default PdfToTextWrapper;
