"use client";

import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Lock, AlertCircle, Loader2 } from "lucide-react";
import { downloadFromUrl } from "@/lib/download";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ToolLayout from "@/components/tools/ToolLayout";
import PdfUpload from "../PdfUpload";
import { protectPDF } from "@/actions/pdf-protect-action";

const ProtectWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [protectedPdf, setProtectedPdf] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleProtect = async () => {
    if (files.length === 0) return;

    // Client-side validation
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (password.length < 4) {
      setError("Password must be at least 4 characters long!");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();

      // Call server action
      const result = await protectPDF(arrayBuffer, password);

      if (result.success && result.data) {
        // Create blob from protected PDF
        const blob = new Blob([result.data], {
          type: "application/pdf",
        });
        const url = URL.createObjectURL(blob);
        setProtectedPdf(url);
      } else {
        setError(result.error || "Failed to protect PDF");
      }
    } catch (err) {
      console.error("Error protecting PDF:", err);
      setError("Failed to protect PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!protectedPdf) return;

    setIsDownloading(true);
    try {
      const filename = `protected_${files[0]?.name.replace(".pdf", "") || "document"}.pdf`;
      const success = await downloadFromUrl(protectedPdf, filename);

      if (!success) {
        setError("Failed to download file. Please try again.");
      }
    } catch (error) {
      setError("Failed to download file. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const resetAll = () => {
    setFiles([]);
    setProtectedPdf(null);
    setPassword("");
    setConfirmPassword("");
    setError(null);
  };

  const clearError = () => setError(null);

  return (
    <ToolLayout
      title="Protect PDF"
      showUpload={true}
      description="Encrypt your PDF files with a password. Your document will be fully encrypted and require a password to open."
    >
      <Card>
        <CardContent className="p-6">
          {!protectedPdf ? (
            <>
              <PdfUpload onFilesSelected={setFiles} multiple={false} />

              {files.length > 0 && (
                <div className="mt-6 space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {error}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearError}
                          className="ml-2 h-6 px-2"
                        >
                          Dismiss
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <Label htmlFor="password" className="mb-2 block">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password (min 4 characters)"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearError();
                      }}
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
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        clearError();
                      }}
                    />
                  </div>

                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Secure Encryption:</strong> Your PDF will be fully
                      encrypted with AES-128 encryption. Users will need to enter
                      the password to open the document.
                    </AlertDescription>
                  </Alert>

                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Your PDF will be encrypted with a password. Make sure to
                      remember your password - you'll need it to open the
                      protected PDF file.
                    </p>
                  </div>

                  <Button
                    onClick={handleProtect}
                    disabled={
                      isProcessing ||
                      !password ||
                      password !== confirmPassword ||
                      password.length < 4
                    }
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Securing PDF...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Secure PDF
                      </>
                    )}
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
                PDF Encrypted Successfully!
              </h3>

              <div className="space-y-4 mb-6">
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">
                    <strong>Success!</strong> Your PDF has been encrypted with a
                    password. The document is now protected and requires the
                    password to open.
                  </AlertDescription>
                </Alert>

                <Alert variant={"default"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> Save your password in a safe
                    place. You'll need it to open this PDF file. The document
                    is encrypted with AES-128 encryption.
                  </AlertDescription>
                </Alert>
              </div>

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
                      Download Encrypted PDF
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={resetAll} size="lg">
                  Encrypt Another PDF
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
