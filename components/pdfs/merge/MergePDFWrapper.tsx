"use client"

import { FC, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Layers } from "lucide-react"
import { PDFDocument } from "pdf-lib"
import ToolLayout from "@/components/tools/ToolLayout"

const MergerPDFWrapper: FC = () => {
    const [files, setFiles] = useState<File[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null)

    const handleMergePDFs = async () => {
        if (files.length < 2) return

        setIsProcessing(true)
        try {
            const mergedPdf = await PDFDocument.create()

            for (const file of files) {
                const arrayBuffer = await file.arrayBuffer()
                const pdf = await PDFDocument.load(arrayBuffer)
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
                copiedPages.forEach((page) => mergedPdf.addPage(page))
            }

            const mergedPdfBytes = await mergedPdf.save()
            const blob = new Blob([mergedPdfBytes as unknown as BlobPart], { type: "application/pdf" }) // priamo Uint8Array
            const url = URL.createObjectURL(blob)
            setMergedPdfUrl(url)

        } catch (error) {
            console.error("Error merging PDFs:", error)
            alert("Failed to merge PDFs. Please try again.")
        } finally {
            setIsProcessing(false)
        }
    }

    const handleDownload = () => {
        if (!mergedPdfUrl) return
        const link = document.createElement("a")
        link.href = mergedPdfUrl
        link.download = "merged.pdf"
        link.click()
    }

    return (
        <ToolLayout
            title="Merge PDF"
            description="Combine multiple PDF files into one document. Simply upload your PDFs and merge them in seconds."
            icon={<Layers className="w-8 h-8" />}
            files={files}
            onFilesChange={setFiles}
            acceptedFileTypes=".pdf"
            maxFiles={20}
        >
            {!mergedPdfUrl ? (
                <>
                    {files.length >= 2 && (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                {files.length} files selected. They will be merged in the order shown.
                            </p>
                            <Button onClick={handleMergePDFs} disabled={isProcessing} className="w-full" size="lg">
                                {isProcessing ? "Merging PDFs..." : "Merge PDFs"}
                            </Button>
                        </div>
                    )}

                    {files.length === 1 && (
                        <p className="text-sm text-muted-foreground text-center">Please select at least 2 PDF files to merge</p>
                    )}
                </>
            ) : (
                <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                        <Download className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">PDF Merged Successfully!</h3>
                    <p className="text-muted-foreground mb-6">Your merged PDF is ready to download.</p>
                    <div className="flex gap-3 justify-center">
                        <Button onClick={handleDownload} size="lg">
                            <Download className="w-4 h-4 mr-2" />
                            Download Merged PDF
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setFiles([])
                                setMergedPdfUrl(null)
                            }}
                            size="lg"
                        >
                            Merge More PDFs
                        </Button>
                    </div>
                </div>
            )}
        </ToolLayout>
    )
}

export default MergerPDFWrapper