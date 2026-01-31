"use client";

import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Lock, AlertCircle, Loader2 } from "lucide-react";
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

  const handleDownload = () => {
    if (!protectedPdf) return;
    const link = document.createElement("a");
    link.href = protectedPdf;
    link.download = `protected_${files[0]?.name.replace(".pdf", "") || "document"}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      description="Add security metadata to your PDF files. Your document will be marked as protected."
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
                      Security Key
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter security key (min 4 characters)"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearError();
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="mb-2 block">
                      Confirm Security Key
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm security key"
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
                      <strong>Note:</strong> This adds security metadata to your
                      PDF. For full encryption with password prompts, consider
                      using professional PDF software.
                    </AlertDescription>
                  </Alert>

                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Your PDF will be marked as protected with security
                      metadata. The security key is used for identification
                      purposes.
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
                PDF Secured Successfully!
              </h3>

              <div className="space-y-4 mb-6">
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">
                    <strong>Success!</strong> Security metadata has been added
                    to your PDF document.
                  </AlertDescription>
                </Alert>

                <Alert variant={"default"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Note:</strong> This PDF contains security metadata
                    but is not encrypted. For full password protection, use
                    dedicated PDF software.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex gap-3 justify-center">
                <Button onClick={handleDownload} size="lg">
                  <Download className="w-4 h-4 mr-2" />
                  Download Secured PDF
                </Button>
                <Button variant="outline" onClick={resetAll} size="lg">
                  Secure Another PDF
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
