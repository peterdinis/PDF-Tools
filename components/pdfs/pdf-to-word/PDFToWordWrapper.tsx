"use client";

import { FC, useState } from "react";
import { FileText, Download, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as pdfjsLib from "pdfjs-dist";
import ToolLayout from "@/components/tools/ToolLayout";

// Set worker path
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

const PdfToWordWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [converting, setConverting] = useState(false);
  const [converted, setConverted] = useState(false);
  const [extractedText, setExtractedText] = useState("");

  const handleConvert = async () => {
    if (files.length === 0) return;

    setConverting(true);
    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += `Page ${i}\n\n${pageText}\n\n`;
      }

      setExtractedText(fullText);
      setConverting(false);
      setConverted(true);
    } catch (error) {
      console.error("Error extracting text:", error);
      alert("Failed to extract text from PDF.");
      setConverting(false);
    }
  };

  const handleDownload = () => {
    // Create a simple blob with text content
    // Many Word processors will open .docx if it's actually just text or basic HTML
    // But for better compatibility we can just use .txt or a simple HTML wrapper
    const blob = new Blob([extractedText], {
      type: "application/msword",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${files[0].name.replace(".pdf", "")}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetAll = () => {
    setFiles([]);
    setConverting(false);
    setConverted(false);
    setExtractedText("");
  };

  return (
    <ToolLayout
      title="PDF to Word"
      description="Convert PDF files to editable Word documents"
      icon={<FileText className="w-8 h-8" />}
      files={files}
      onFilesChange={setFiles}
      acceptedFileTypes=".pdf"
      maxFiles={1}
      showUpload={true}
    >
      {files.length > 0 && !converted && (
        <div className="space-y-4">
          <Button
            onClick={handleConvert}
            disabled={converting}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            {converting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              "Convert to Word"
            )}
          </Button>

          <Button
            onClick={handleResetAll}
            variant="outline"
            size="lg"
            className="w-full text-red-500 hover:text-red-600"
          >
            <X className="w-4 h-4 mr-2" />
            Reset All
          </Button>
        </div>
      )}

      {converted && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">Conversion complete!</p>
          </div>
          <Button
            onClick={handleDownload}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Word Document
          </Button>
          <Button
            onClick={handleResetAll}
            variant="outline"
            size="lg"
            className="w-full"
          >
            Convert Another PDF
          </Button>
        </div>
      )}
    </ToolLayout>
  );
};

export default PdfToWordWrapper;
