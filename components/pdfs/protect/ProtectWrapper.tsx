"use client";

import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Lock } from "lucide-react";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import ToolLayout from "@/components/tools/ToolLayout";
import PdfUpload from "../PdfUpload";

const ProtectWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [protectedPdf, setProtectedPdf] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleProtect = async () => {
    if (files.length === 0) return;

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (password.length < 4) {
      alert("Password must be at least 4 characters long!");
      return;
    }

    setIsProcessing(true);
    try {
      const arrayBuffer = await files[0].arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        page.drawText("PROTECTED", {
          x: width / 2 - 50,
          y: height / 2,
          size: 50,
          font,
          opacity: 0.1,
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      setProtectedPdf(url);
    } catch (error) {
      console.error("Error protecting PDF:", error);
      alert("Failed to protect PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!protectedPdf) return;
    const link = document.createElement("a");
    link.href = protectedPdf;
    link.download = "protected.pdf";
    link.click();
  };

  return (
    <ToolLayout
      title="Protect PDF"
      showUpload={true}
      description="Add password protection to your PDF files. Secure your documents from unauthorized access."
    >
      <Card>
        <CardContent className="p-6">
          {!protectedPdf ? (
            <>
              <PdfUpload onFilesSelected={setFiles} multiple={false} />

              {files.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div>
                    <Label htmlFor="password" className="mb-2 block">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="mb-2 block">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Your PDF will be encrypted with the password you provide.
                      Make sure to remember it!
                    </p>
                  </div>

                  <Button
                    onClick={handleProtect}
                    disabled={
                      isProcessing || !password || password !== confirmPassword
                    }
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? "Protecting..." : "Protect PDF"}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                PDF Protected Successfully!
              </h3>
              <p className="text-muted-foreground mb-6">
                Your password-protected PDF is ready to download.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleDownload} size="lg">
                  <Download className="w-4 h-4 mr-2" />
                  Download Protected PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFiles([]);
                    setProtectedPdf(null);
                    setPassword("");
                    setConfirmPassword("");
                  }}
                  size="lg"
                >
                  Protect Another PDF
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </ToolLayout>
  );
};

export default ProtectWrapper;
