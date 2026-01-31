"use client";

import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Layers, ArrowUp, ArrowDown, Trash2, Loader2 } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import ToolLayout from "@/components/tools/ToolLayout";

const MergerPDFWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);

  const moveFile = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === files.length - 1)
    )
      return;
    const newFiles = [...files];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newFiles[index], newFiles[swapIndex]] = [
      newFiles[swapIndex],
      newFiles[index],
    ];
    setFiles(newFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
  };

  const handleMergePDFs = async () => {
    if (files.length < 2) return;
    setIsProcessing(true);
    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const pdf = await PDFDocument.load(await file.arrayBuffer());
        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices(),
        );
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      setMergedPdfUrl(
        URL.createObjectURL(
          new Blob([mergedPdfBytes as unknown as BlobPart], {
            type: "application/pdf",
          }),
        ),
      );
    } catch (error) {
      console.error("Error merging PDFs:", error);
      alert("Failed to merge PDFs. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!mergedPdfUrl) return;
    const link = document.createElement("a");
    link.href = mergedPdfUrl;
    link.download = "merged.pdf";
    link.click();
  };

  const resetAll = () => {
    setFiles([]);
    setMergedPdfUrl(null);
  };

  const clearAllFiles = () => {
    setFiles([]);
  };

  return (
    <ToolLayout
      title="Merge PDF"
      description="Combine multiple PDF files into one document. Simply upload your PDFs and merge them in seconds."
      icon={<Layers className="w-8 h-8" />}
      files={files}
      onFilesChange={setFiles}
      acceptedFileTypes=".pdf"
      maxFiles={20}
      showUpload={true}
    >
      {files.length === 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Upload PDF files to get started.
        </p>
      )}

      {files.length > 0 && !mergedPdfUrl && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {files.length} file{files.length > 1 ? "s" : ""} selected. Adjust
              their order before merging.
            </p>
            {files.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFiles}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </Button>
            )}
          </div>

          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={file.name}
                className="flex items-center justify-between border p-2 rounded"
              >
                <span className="truncate flex-1">{file.name}</span>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => moveFile(index, "up")}
                    disabled={index === 0}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => moveFile(index, "down")}
                    disabled={index === files.length - 1}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          {files.length >= 2 && (
            <Button
              onClick={handleMergePDFs}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Merging PDFs...
                </>
              ) : (
                "Merge PDFs"
              )}
            </Button>
          )}

        </div>
      )}

      {mergedPdfUrl && (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Download className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            PDF Merged Successfully!
          </h3>
          <p className="text-muted-foreground mb-6">
            Your merged PDF is ready to download.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleDownload} size="lg">
              <Download className="w-4 h-4 mr-2" />
              Download Merged PDF
            </Button>
            <Button variant="outline" onClick={resetAll} size="lg">
              Merge More PDFs
            </Button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};

export default MergerPDFWrapper;
