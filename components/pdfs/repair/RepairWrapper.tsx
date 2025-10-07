"use client"

import { FC, useState } from "react"
import { Wrench, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PDFDocument } from "pdf-lib"
import ToolLayout from "@/components/tools/ToolLayout"

const RepairWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([])
  const [processing, setProcessing] = useState(false)
  const [processedUrl, setProcessedUrl] = useState<string | null>(null)
  const [repairStatus, setRepairStatus] = useState<string>("")

  const handleProcess = async () => {
    if (files.length === 0) return

    setProcessing(true)
    try {
      const file = files[0]
      const arrayBuffer = await file.arrayBuffer()

      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
        updateMetadata: false,
      })

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      setProcessedUrl(url)
      setRepairStatus("PDF repaired successfully! The file has been reconstructed.")
    } catch (error) {
      console.error("Error repairing PDF:", error)
      setRepairStatus("Could not repair this PDF. The file may be too corrupted or encrypted.")
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!processedUrl) return
    const link = document.createElement("a")
    link.href = processedUrl
    link.download = "repaired.pdf"
    link.click()
  }

  return (
    <ToolLayout
      title="Repair PDF"
      description="Fix corrupted or damaged PDF files"
      icon={<Wrench className="w-8 h-8" />}
      files={files}
      onFilesChange={setFiles}
      acceptedFileTypes=".pdf"
      maxFiles={1}
      showUpload={true}
    >
      {files.length > 0 && !processedUrl && !repairStatus && (
        <Button
          onClick={handleProcess}
          disabled={processing}
          className="w-full bg-primary hover:bg-primary/90"
          size="lg"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Repairing...
            </>
          ) : (
            "Repair PDF"
          )}
        </Button>
      )}

      {processedUrl && (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Download className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">PDF Repaired Successfully!</h3>
          <p className="text-muted-foreground mb-6">{repairStatus}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleDownload} size="lg">
              <Download className="w-4 h-4 mr-2" />
              Download Repaired PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFiles([])
                setProcessedUrl(null)
                setRepairStatus("")
              }}
              size="lg"
            >
              Repair Another PDF
            </Button>
          </div>
        </div>
      )}

      {repairStatus && !processedUrl && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">{repairStatus}</p>
        </div>
      )}
    </ToolLayout>
  )
}

export default RepairWrapper