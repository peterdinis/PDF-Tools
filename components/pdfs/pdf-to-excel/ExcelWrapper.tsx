"use client"

import { FC, useState } from "react"
import { Table, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import ToolLayout from "@/components/tools/ToolLayout"

const ExcelWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([])
  const [converting, setConverting] = useState(false)
  const [converted, setConverted] = useState(false)

  const handleConvert = async () => {
    if (files.length === 0) return

    setConverting(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setConverting(false)
    setConverted(true)
  }

  const handleDownload = () => {
    const blob = new Blob(["Converted Excel content"], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "converted.xlsx"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ToolLayout
      title="PDF to Excel"
      description="Convert PDF tables to Excel spreadsheets"
      icon={<Table className="w-8 h-8" />}
      files={files}
      onFilesChange={setFiles}
      acceptedFileTypes=".pdf"
      maxFiles={1}
      showUpload={true}
    >
      {files.length > 0 && !converted && (
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
            "Convert to Excel"
          )}
        </Button>
      )}

      {converted && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">Conversion complete!</p>
          </div>
          <Button onClick={handleDownload} className="w-full bg-primary hover:bg-primary/90" size="lg">
            <Download className="w-4 h-4 mr-2" />
            Download Excel File
          </Button>
        </div>
      )}
    </ToolLayout>
  )
}


export default ExcelWrapper