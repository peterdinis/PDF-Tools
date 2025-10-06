"use client"

import { FC, useState } from "react"
import { FileText, Download, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import ToolLayout from "@/components/tools/ToolLayout"

const PdfToWordWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([])
  const [converting, setConverting] = useState(false)
  const [converted, setConverted] = useState(false)

  const handleConvert = async () => {
    if (files.length === 0) return

    setConverting(true)
    // Simulate conversion process
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setConverting(false)
    setConverted(true)
  }

  const handleDownload = () => {
    const blob = new Blob(["Converted Word document content"], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "converted.docx"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleResetAll = () => {
    setFiles([])
    setConverting(false)
    setConverted(false)
  }

  return (
    <ToolLayout
      title="PDF to Word"
      description="Convert PDF files to editable Word documents"
      icon={<FileText className="w-8 h-8" />}
      files={files}
      onFilesChange={setFiles}
      acceptedFileTypes=".pdf"
      maxFiles={1}
      showUpload={true}
    >
      {files.length > 0 && !converted && (
        <div className="space-y-4">
          <Button
            onClick={handleConvert}
            disabled={converting}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            {converting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              "Convert to Word"
            )}
          </Button>

          <Button
            onClick={handleResetAll}
            variant="outline"
            size="lg"
            className="w-full text-red-500 hover:text-red-600"
          >
            <X className="w-4 h-4 mr-2" />
            Reset All
          </Button>
        </div>
      )}

      {converted && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">Conversion complete!</p>
          </div>
          <Button onClick={handleDownload} className="w-full bg-primary hover:bg-primary/90" size="lg">
            <Download className="w-4 h-4 mr-2" />
            Download Word Document
          </Button>
          <Button onClick={handleResetAll} variant="outline" size="lg" className="w-full">
            Convert Another PDF
          </Button>
        </div>
      )}
    </ToolLayout>
  )
}

export default PdfToWordWrapper
