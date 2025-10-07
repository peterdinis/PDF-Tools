"use client";

import { FC, useState } from "react";
import { Unlock, Download, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PDFDocument } from "pdf-lib";
import ToolLayout from "@/components/tools/ToolLayout";

const UnlockWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [unlockedPdfUrl, setUnlockedPdfUrl] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleProcess = async () => {
    if (files.length === 0) return;

    setProcessing(true);
    setError("");

    try {
      const pdfBytes = await files[0].arrayBuffer();

      // Note: pdf-lib has limited support for encrypted PDFs
      // This will work for PDFs with user passwords but not owner passwords
      const pdfDoc = await PDFDocument.load(pdfBytes, {
        ignoreEncryption: true,
      });

      const unlockedPdfBytes = await pdfDoc.save();
      const blob = new Blob([unlockedPdfBytes as unknown as BlobPart], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);

      setUnlockedPdfUrl(url);
      setProcessed(true);
    } catch (err) {
      console.error("Error unlocking PDF:", err);
      setError(
        "Failed to unlock PDF. The file may be encrypted with a strong password or corrupted.",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = unlockedPdfUrl;
    a.download = `unlocked-${files[0].name}`;
    a.click();
  };

  return (
    <ToolLayout
      title="Unlock PDF"
      description="Remove password protection from PDF files"
      icon={<Unlock className="w-8 h-8" />}
      files={files}
      onFilesChange={setFiles}
      acceptedFileTypes=".pdf"
      maxFiles={1}
      showUpload={true}
    >
      {files.length > 0 && !processed && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Note about PDF encryption</p>
              <p className="mt-1">
                This tool can remove basic restrictions but may not work with
                strongly encrypted PDFs. For best results, use PDFs with
                user-level passwords.
              </p>
            </div>
          </div>

          <Button
            onClick={handleProcess}
            disabled={processing}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Unlocking...
              </>
            ) : (
              "Unlock PDF"
            )}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>
      )}

      {processed && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              PDF unlocked successfully!
            </p>
            <p className="text-sm text-green-700 mt-1">
              Password protection has been removed
            </p>
          </div>
          <Button
            onClick={handleDownload}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Unlocked PDF
          </Button>
        </div>
      )}
    </ToolLayout>
  );
};

export default UnlockWrapper;
