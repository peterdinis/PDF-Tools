"use client";

import { FC, useState } from "react";
import { Edit, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import ToolLayout from "@/components/tools/ToolLayout";

const EditPdfWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [editing, setEditing] = useState(false);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState("14");

  const handleEdit = async () => {
    if (files.length === 0 || !text) return;

    setEditing(true);
    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const size = Number.parseInt(fontSize);

      const { width, height } = firstPage.getSize();
      firstPage.drawText(text, {
        x: 50,
        y: height - 50,
        size,
        font,
        color: rgb(0, 0, 0),
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      setProcessedUrl(url);
    } catch (error) {
      console.error("Error editing PDF:", error);
      alert("Failed to edit PDF. Please try again.");
    } finally {
      setEditing(false);
    }
  };

  const handleDownload = () => {
    if (!processedUrl) return;
    const link = document.createElement("a");
    link.href = processedUrl;
    link.download = "edited.pdf";
    link.click();
  };

  return (
    <ToolLayout
      title="Edit PDF"
      description="Add text to your PDF"
      icon={<Edit className="w-8 h-8" />}
      files={files}
      onFilesChange={setFiles}
      acceptedFileTypes=".pdf"
      maxFiles={1}
      showUpload={true}
    >
      {files.length > 0 && !processedUrl && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text">Text to Add</Label>
            <Textarea
              id="text"
              placeholder="Enter text to add to PDF..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-32"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fontSize">Font Size</Label>
            <Input
              id="fontSize"
              type="number"
              min="8"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
            />
          </div>
          <Button
            onClick={handleEdit}
            disabled={editing || !text}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            {editing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Editing...
              </>
            ) : (
              "Apply Edits"
            )}
          </Button>
        </div>
      )}

      {processedUrl && (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Download className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            PDF Edited Successfully!
          </h3>
          <p className="text-muted-foreground mb-6">
            Your edited PDF is ready to download.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleDownload} size="lg">
              <Download className="w-4 h-4 mr-2" />
              Download Edited PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFiles([]);
                setProcessedUrl(null);
                setText("");
              }}
              size="lg"
            >
              Edit Another PDF
            </Button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};

export default EditPdfWrapper;
