"use client";

import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Unlock, AlertCircle, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ToolLayout from "@/components/tools/ToolLayout";
import { unlockPDF } from "@/actions/pdf-unlock-action";

const UnlockWrapper: FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [unlockedPdf, setUnlockedPdf] = useState<string | null>(null);
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleUnlock = async () => {
        if (files.length === 0 || !password) return;

        setIsProcessing(true);
        setError(null);

        try {
            const file = files[0];
            const arrayBuffer = await file.arrayBuffer();

            // Call server action
            const result = await unlockPDF(arrayBuffer, password);

            if (result.success && result.data) {
                // Create blob from unlocked PDF
                const blob = new Blob([result.data], {
                    type: "application/pdf",
                });
                const url = URL.createObjectURL(blob);
                setUnlockedPdf(url);
            } else {
                setError(result.error || "Failed to unlock PDF. Please check your password.");
            }
        } catch (err) {
            console.error("Error unlocking PDF:", err);
            setError("Failed to unlock PDF. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!unlockedPdf) return;
        const link = document.createElement("a");
        link.href = unlockedPdf;
        link.download = `unlocked_${files[0]?.name.replace(".pdf", "") || "document"}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const resetAll = () => {
        setFiles([]);
        setUnlockedPdf(null);
        setPassword("");
        setError(null);
    };

    const clearError = () => setError(null);

    return (
        <ToolLayout
            title="Unlock PDF"
            description="Remove password protection from your PDF files."
            icon={<Unlock className="w-8 h-8" />}
            files={files}
            onFilesChange={setFiles}
            acceptedFileTypes=".pdf"
            maxFiles={1}
            showUpload={true}
        >
            <Card>
                <CardContent className="p-6">
                    {!unlockedPdf ? (
                        <>
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
                                            PDF Password
                                        </Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Enter the password to unlock"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                clearError();
                                            }}
                                        />
                                    </div>

                                    <Alert className="bg-yellow-50 border-yellow-200">
                                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                                        <AlertDescription className="text-yellow-800">
                                            <strong>Important:</strong> You must know the password to unlock the document. This tool does not bypass security without a valid password.
                                        </AlertDescription>
                                    </Alert>

                                    <Button
                                        onClick={handleUnlock}
                                        disabled={isProcessing || !password}
                                        className="w-full bg-primary hover:bg-primary/90"
                                        size="lg"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Unlocking PDF...
                                            </>
                                        ) : (
                                            <>
                                                <Unlock className="w-4 h-4 mr-2" />
                                                Unlock PDF
                                            </>
                                        )}
                                    </Button>
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
                            <p className="text-muted-foreground mb-6">
                                The password protection has been removed.
                            </p>

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
