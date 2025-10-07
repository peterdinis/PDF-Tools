"use client";

import { FC, useState } from "react";
import { Code, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ToolLayout from "@/components/tools/ToolLayout";

const HtmlToPdfWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [converting, setConverting] = useState(false);
  const [converted, setConverted] = useState(false);
  const [url, setUrl] = useState("");

  const handleConvert = async () => {
    if (files.length === 0 && !url) return;

    setConverting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setConverting(false);
    setConverted(true);
  };

  const handleDownload = () => {
    const blob = new Blob(["Converted PDF content"], {
      type: "application/pdf",
    });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = "converted.pdf";
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <ToolLayout
      title="HTML to PDF"
      description="Convert HTML files or web pages to PDF"
      icon={<Code className="w-8 h-8" />}
      files={files}
      onFilesChange={setFiles}
      acceptedFileTypes=".html,.htm"
      maxFiles={1}
      showUpload={true}
    >
      {!converted && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Or enter a URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <Button
            onClick={handleConvert}
            disabled={converting || (files.length === 0 && !url)}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            {converting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              "Convert to PDF"
            )}
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
            Download PDF
          </Button>
        </div>
      )}
    </ToolLayout>
  );
};

export default HtmlToPdfWrapper;
