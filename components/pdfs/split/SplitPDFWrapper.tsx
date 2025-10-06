"use client"

import { FC, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, FileText } from "lucide-react"
import { PDFDocument } from "pdf-lib"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import ToolLayout from "@/components/tools/ToolLayout"
import PdfUpload from "../PdfUpload"

type SplitMode = "all" | "range" | "extract"

const SplitPDFWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [splitPdfs, setSplitPdfs] = useState<{ blob: Blob; name: string }[]>([])
  const [splitMode, setSplitMode] = useState<SplitMode>("all")
  const [pageRange, setPageRange] = useState("")
  const [totalPages, setTotalPages] = useState(0)

  const handleFileSelected = async (selectedFiles: File[]) => {
    setFiles(selectedFiles)
    if (selectedFiles.length > 0) {
      try {
        const arrayBuffer = await selectedFiles[0].arrayBuffer()
        const pdf = await PDFDocument.load(arrayBuffer)
        setTotalPages(pdf.getPageCount())
      } catch (error) {
        console.error("[v0] Error loading PDF:", error)
      }
    }
  }

  const handleSplitPDF = async () => {
    if (files.length === 0) return

    setIsProcessing(true)
    try {
      const arrayBuffer = await files[0].arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      const pageCount = pdf.getPageCount()
      const results: { blob: Blob; name: string }[] = []

      if (splitMode === "all") {
        // Split into individual pages
        for (let i = 0; i < pageCount; i++) {
          const newPdf = await PDFDocument.create()
          const [copiedPage] = await newPdf.copyPages(pdf, [i])
          newPdf.addPage(copiedPage)
          const pdfBytes = await newPdf.save()
          const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" })
          results.push({ blob, name: `page-${i + 1}.pdf` })
        }
      } else if (splitMode === "range" && pageRange) {
        // Split by range (e.g., "1-3,5,7-9")
        const ranges = pageRange.split(",").map((r) => r.trim())
        for (const range of ranges) {
          const newPdf = await PDFDocument.create()
          if (range.includes("-")) {
            const [start, end] = range.split("-").map((n) => Number.parseInt(n.trim()) - 1)
            for (let i = start; i <= end && i < pageCount; i++) {
              const [copiedPage] = await newPdf.copyPages(pdf, [i])
              newPdf.addPage(copiedPage)
            }
            const pdfBytes = await newPdf.save()
            const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" })
            results.push({ blob, name: `pages-${range}.pdf` })
          } else {
            const pageNum = Number.parseInt(range) - 1
            if (pageNum >= 0 && pageNum < pageCount) {
              const [copiedPage] = await newPdf.copyPages(pdf, [pageNum])
              newPdf.addPage(copiedPage)
              const pdfBytes = await newPdf.save()
              const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" })
              results.push({ blob, name: `page-${range}.pdf` })
            }
          }
        }
      } else if (splitMode === "extract" && pageRange) {
        // Extract specific pages
        const newPdf = await PDFDocument.create()
        const pages = pageRange
          .split(",")
          .map((p) => Number.parseInt(p.trim()) - 1)
          .filter((p) => p >= 0 && p < pageCount)
        const copiedPages = await newPdf.copyPages(pdf, pages)
        copiedPages.forEach((page) => newPdf.addPage(page))
        const pdfBytes = await newPdf.save()
        const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" })
        results.push({ blob, name: `extracted-pages.pdf` })
      }

      setSplitPdfs(results)
    } catch (error) {
      console.error("[v0] Error splitting PDF:", error)
      alert("Failed to split PDF. Please check your page range and try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = name
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadAll = () => {
    splitPdfs.forEach(({ blob, name }) => {
      setTimeout(() => handleDownload(blob, name), 100)
    })
  }

  return (
    <ToolLayout
      title="Split PDF"
      showUpload={true}
      description="Extract pages from your PDF or split it into multiple files. Choose how you want to split your document."
    >
      <Card>
        <CardContent className="p-6">
          {splitPdfs.length === 0 ? (
            <>
              <PdfUpload onFilesSelected={handleFileSelected} multiple={false} />

              {files.length > 0 && (
                <div className="mt-6 space-y-6">
                  <div>
                    <p className="text-sm font-medium mb-3">Total pages: {totalPages}</p>
                    <Label className="text-base font-semibold mb-3 block">Split Mode</Label>
                    <RadioGroup value={splitMode} onValueChange={(value) => setSplitMode(value as SplitMode)}>
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="all" id="all" />
                        <Label htmlFor="all" className="font-normal cursor-pointer">
                          Split into individual pages
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="range" id="range" />
                        <Label htmlFor="range" className="font-normal cursor-pointer">
                          Split by page ranges
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="extract" id="extract" />
                        <Label htmlFor="extract" className="font-normal cursor-pointer">
                          Extract specific pages
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {(splitMode === "range" || splitMode === "extract") && (
                    <div>
                      <Label htmlFor="pageRange" className="mb-2 block">
                        {splitMode === "range" ? "Page Ranges (e.g., 1-3,5,7-9)" : "Page Numbers (e.g., 1,3,5)"}
                      </Label>
                      <Input
                        id="pageRange"
                        placeholder={splitMode === "range" ? "1-3,5,7-9" : "1,3,5"}
                        value={pageRange}
                        onChange={(e) => setPageRange(e.target.value)}
                      />
                    </div>
                  )}

                  <Button onClick={handleSplitPDF} disabled={isProcessing} className="w-full" size="lg">
                    {isProcessing ? "Splitting PDF..." : "Split PDF"}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">PDF Split Successfully!</h3>
                <p className="text-muted-foreground mb-4">
                  {splitPdfs.length} {splitPdfs.length === 1 ? "file" : "files"} created
                </p>
                <Button onClick={handleDownloadAll} size="lg" className="mb-4">
                  <Download className="w-4 h-4 mr-2" />
                  Download All Files
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground">Individual Files:</h4>
                {splitPdfs.map((pdf, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="font-medium text-sm">{pdf.name}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(pdf.blob, pdf.name)}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setFiles([])
                  setSplitPdfs([])
                  setPageRange("")
                }}
                className="w-full"
              >
                Split Another PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </ToolLayout>
  )
}


export default SplitPDFWrapper