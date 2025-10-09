"use client";

import { FC, useState } from "react";
import { Unlock, Download, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ToolLayout from "@/components/tools/ToolLayout";
import PdfUpload from "../PdfUpload";
import { unlockPDF } from "@/actions/unlock-pdf-action";

const UnlockWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [unlockedPdfUrl, setUnlockedPdfUrl] = useState<string>("");
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [error, setError] = useState<string>("");

  const handleProcess = async (withPassword: boolean = false) => {
    if (files.length === 0) return;

    setProcessing(true);
    setError("");

    try {
      const arrayBuffer = await files[0].arrayBuffer();

      // Call server action
      const result = await unlockPDF(
        arrayBuffer,
        withPassword ? password : undefined,
      );

      if (result.success && result.data) {
        const blob = new Blob([result.data], {
          type: "application/pdf",
        });
        const url = URL.createObjectURL(blob);

        setUnlockedPdfUrl(url);
        setProcessed(true);
        setShowPasswordInput(false);
        setPassword(""); // Clear password after successful unlock
      } else {
        // If it failed and we haven't tried with password yet, show password input
        if (!withPassword && result.needsPassword) {
          setShowPasswordInput(true);
          setError(
            "PDF appears to be password protected. Please enter the password to unlock it.",
          );
        } else {
          setError(
            result.error ||
              "Failed to unlock PDF. The file may be encrypted with a strong password or corrupted.",
          );
        }
      }
    } catch (err) {
      console.error("Error unlocking PDF:", err);
      setError("Failed to unlock PDF. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!unlockedPdfUrl) return;
    const link = document.createElement("a");
    link.href = unlockedPdfUrl;
    link.download = `unlocked_${files[0]?.name || "document.pdf"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAll = () => {
    setFiles([]);
    setProcessed(false);
    setUnlockedPdfUrl("");
    setPassword("");
    setShowPasswordInput(false);
    setError("");
    if (unlockedPdfUrl) {
      URL.revokeObjectURL(unlockedPdfUrl);
    }
  };

  const clearError = () => setError("");

  return (
    <ToolLayout
      title="Unlock PDF"
      showUpload={true}
      description="Remove password protection and restrictions from PDF files"
    >
      <Card>
        <CardContent className="p-6">
          {!processed ? (
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

                  {showPasswordInput && (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="password" className="mb-2 block">
                          PDF Password
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter PDF password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (error) clearError();
                          }}
                          className="mb-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          This PDF requires a password to unlock
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleProcess(true)}
                          disabled={processing || !password}
                          className="flex-1"
                        >
                          {processing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Unlocking...
                            </>
                          ) : (
                            <>
                              <Unlock className="w-4 h-4 mr-2" />
                              Unlock with Password
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={resetAll}
                          disabled={processing}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {!showPasswordInput && (
                    <>
                      <Alert className="bg-blue-50 border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          <strong>Note:</strong> This tool can remove password
                          protection and restrictions from PDF files. If your
                          PDF is encrypted, you'll need to provide the password.
                        </AlertDescription>
                      </Alert>

                      <Button
                        onClick={() => handleProcess(false)}
                        disabled={processing}
                        className="w-full"
                        size="lg"
                      >
                        {processing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing PDF...
                          </>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4 mr-2" />
                            Unlock PDF
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Unlock className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                PDF Unlocked Successfully!
              </h3>

              <div className="space-y-4 mb-6">
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">
                    <strong>Success!</strong> Password protection and
                    restrictions have been removed from your PDF.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex gap-3 justify-center">
                <Button onClick={handleDownload} size="lg">
                  <Download className="w-4 h-4 mr-2" />
                  Download Unlocked PDF
                </Button>
                <Button variant="outline" onClick={resetAll} size="lg">
                  Unlock Another PDF
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </ToolLayout>
  );
};

export default UnlockWrapper;
