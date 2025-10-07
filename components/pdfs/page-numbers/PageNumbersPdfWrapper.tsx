"use client"

import { FC, useState } from "react"
import { Hash, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import ToolLayout from "@/components/tools/ToolLayout"

const PageNumbersPdfWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([])
  const [processing, setProcessing] = useState(false)
  const [processedUrl, setProcessedUrl] = useState<string | null>(null)
  const [position, setPosition] = useState("bottom-center")

  const handleProcess = async () => {
    if (files.length === 0) return

    setProcessing(true)
    try {
      const file = files[0]
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      const pages = pdfDoc.getPages()
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const fontSize = 12

      pages.forEach((page, index) => {
        const { width, height } = page.getSize()
        const pageNumber = `${index + 1}`
        const textWidth = font.widthOfTextAtSize(pageNumber, fontSize)

        let x = width / 2 - textWidth / 2
        let y = 20

        if (position.includes("top")) {
          y = height - 30
        }
        if (position.includes("left")) {
          x = 30
        } else if (position.includes("right")) {
          x = width - 30 - textWidth
        }

        page.drawText(pageNumber, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        })
      })

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      setProcessedUrl(url)
    } catch (error) {
      console.error("Error adding page numbers:", error)
      alert("Failed to add page numbers. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!processedUrl) return
    const link = document.createElement("a")
    link.href = processedUrl
    link.download = "numbered.pdf"
    link.click()
  }

  return (
    <ToolLayout
      title="Add Page Numbers"
      description="Add page numbers to your PDF documents"
      icon={<Hash className="w-8 h-8" />}
      files={files}
      onFilesChange={setFiles}
      acceptedFileTypes=".pdf"
      maxFiles={1}
      showUpload={true}
    >
      {files.length > 0 && !processedUrl && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger id="position">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top-left">Top Left</SelectItem>
                <SelectItem value="top-center">Top Center</SelectItem>
                <SelectItem value="top-right">Top Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="bottom-center">Bottom Center</SelectItem>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleProcess}
            disabled={processing}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding Numbers...
              </>
            ) : (
              "Add Page Numbers"
            )}
          </Button>
        </div>
      )}

      {processedUrl && (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Download className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Page Numbers Added Successfully!</h3>
          <p className="text-muted-foreground mb-6">Your numbered PDF is ready to download.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleDownload} size="lg">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFiles([])
                setProcessedUrl(null)
              }}
              size="lg"
            >
              Add More Numbers
            </Button>
          </div>
        </div>
      )}
    </ToolLayout>
  )
}

export default PageNumbersPdfWrapper