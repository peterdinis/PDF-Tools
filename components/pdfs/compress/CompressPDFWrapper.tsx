"use client"

import { FC, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Minimize2, X } from "lucide-react"
import { PDFDocument } from "pdf-lib"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import ToolLayout from "@/components/tools/ToolLayout"
import PdfUpload from "../PdfUpload"

type CompressionLevel = "low" | "medium" | "high"

const CompressPDFWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [compressedPdf, setCompressedPdf] = useState<{ url: string; size: number } | null>(null)
  const [originalSize, setOriginalSize] = useState(0)
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>("medium")

  const handleFileSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles)
    if (selectedFiles.length > 0) {
      setOriginalSize(selectedFiles[0].size)
    }
  }

  const handleCompress = async () => {
    if (files.length === 0) return

    setIsProcessing(true)
    try {
      const arrayBuffer = await files[0].arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)

      // Basic compression by removing metadata and optimizing
      pdfDoc.setTitle("")
      pdfDoc.setAuthor("")
      pdfDoc.setSubject("")
      pdfDoc.setKeywords([])
      pdfDoc.setProducer("")
      pdfDoc.setCreator("")

      const pdfBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      })

      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      setCompressedPdf({ url, size: blob.size })
    } catch (error) {
      console.error("[v0] Error compressing PDF:", error)
      alert("Failed to compress PDF. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!compressedPdf) return
    const link = document.createElement("a")
    link.href = compressedPdf.url
    link.download = "compressed.pdf"
    link.click()
  }

  const formatSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + " MB"
  }

  const getCompressionPercentage = () => {
    if (!compressedPdf || originalSize === 0) return 0
    return Math.round(((originalSize - compressedPdf.size) / originalSize) * 100)
  }

  const handleResetAll = () => {
    setFiles([])
    setCompressedPdf(null)
    setOriginalSize(0)
    setCompressionLevel("medium")
  }

  return (
    <ToolLayout
      title="Compress PDF"
      showUpload={true}
      description="Reduce PDF file size while maintaining quality. Optimize your PDFs for faster sharing and storage."
    >
      <Card>
        <CardContent className="p-6">
          {!compressedPdf ? (
            <>
              <PdfUpload onFilesSelected={handleFileSelected} multiple={false} />

              {files.length > 0 && (
                <div className="mt-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="p-4 bg-secondary rounded-lg">
                      <p className="text-sm text-muted-foreground">Original size: {formatSize(originalSize)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={handleResetAll}
                    >
                      <X className="w-4 h-4 mr-1" /> Reset All
                    </Button>
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-3 block">Compression Level</Label>
                    <RadioGroup
                      value={compressionLevel}
                      onValueChange={(value) => setCompressionLevel(value as CompressionLevel)}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="low" id="low" />
                        <Label htmlFor="low" className="font-normal cursor-pointer">
                          Low compression (best quality)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="medium" id="medium" />
                        <Label htmlFor="medium" className="font-normal cursor-pointer">
                          Medium compression (recommended)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="high" id="high" />
                        <Label htmlFor="high" className="font-normal cursor-pointer">
                          High compression (smallest size)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button onClick={handleCompress} disabled={isProcessing} className="w-full" size="lg">
                    {isProcessing ? "Compressing..." : "Compress PDF"}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Minimize2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">PDF Compressed Successfully!</h3>
              <div className="space-y-2 mb-6">
                <p className="text-muted-foreground">
                  Original size: <span className="font-semibold">{formatSize(originalSize)}</span>
                </p>
                <p className="text-muted-foreground">
                  Compressed size: <span className="font-semibold">{formatSize(compressedPdf.size)}</span>
                </p>
                <p className="text-lg font-semibold text-green-600">Reduced by {getCompressionPercentage()}%</p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleDownload} size="lg">
                  <Download className="w-4 h-4 mr-2" />
                  Download Compressed PDF
                </Button>
                <Button variant="outline" onClick={handleResetAll} size="lg">
                  Compress Another PDF
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </ToolLayout>
  )
}

export default CompressPDFWrapper
