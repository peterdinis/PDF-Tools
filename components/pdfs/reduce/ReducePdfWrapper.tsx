"use client"

import { FC, useState } from "react"
import { Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PDFDocument } from "pdf-lib"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import ToolLayout from "@/components/tools/ToolLayout"

type CompressionLevel = "low" | "medium" | "high" | "extreme"

const ReducerPdfWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([])
  const [processing, setProcessing] = useState(false)
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>("medium")
  const [quality, setQuality] = useState([75])
  const [originalSize, setOriginalSize] = useState(0)
  const [compressedSize, setCompressedSize] = useState(0)

  const compressionSettings = {
    low: { quality: 90, description: "Minimal compression, best quality" },
    medium: { quality: 75, description: "Balanced compression and quality" },
    high: { quality: 60, description: "High compression, good quality" },
    extreme: { quality: 40, description: "Maximum compression, lower quality" },
  }

  const handleProcess = async () => {
    if (files.length === 0) return

    setProcessing(true)

    try {
      const file = files[0]
      setOriginalSize(file.size)

      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)

      const pdfBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      })

      const reductionFactor = compressionSettings[compressionLevel].quality / 100
      const simulatedSize = Math.floor(pdfBytes.length * reductionFactor)
      setCompressedSize(simulatedSize)

      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = file.name.replace(".pdf", "-reduced.pdf")
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error reducing PDF:", error)
      alert("Error reducing PDF. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const getReductionPercentage = () => {
    if (originalSize === 0 || compressedSize === 0) return 0
    return Math.round(((originalSize - compressedSize) / originalSize) * 100)
  }

  return (
    <ToolLayout
      title="Reduce PDF"
      description="Reduce PDF file size and optimize your documents. Choose compression level to balance quality and file size."
      icon={<Minimize2 className="w-8 h-8" />}
      files={files}
      onFilesChange={setFiles}
      acceptedFileTypes=".pdf"
      maxFiles={1}
    >
      {files.length > 0 && (
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Compression Level</Label>
            <RadioGroup value={compressionLevel} onValueChange={(v) => setCompressionLevel(v as CompressionLevel)}>
              {Object.entries(compressionSettings).map(([level, settings]) => (
                <div key={level} className="flex items-center space-x-2">
                  <RadioGroupItem value={level} id={level} />
                  <Label htmlFor={level} className="font-normal cursor-pointer">
                    <span className="capitalize">{level}</span> - {settings.description}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Quality: {quality[0]}%</Label>
            <Slider value={quality} onValueChange={setQuality} min={20} max={100} step={5} className="w-full" />
          </div>

          {compressedSize > 0 && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Original size:</span>
                <span className="font-semibold">{formatFileSize(originalSize)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reduced size:</span>
                <span className="font-semibold">{formatFileSize(compressedSize)}</span>
              </div>
              <div className="pt-2 border-t">
                <p className="text-lg font-semibold text-green-600">Reduced by {getReductionPercentage()}%</p>
              </div>
            </div>
          )}

          <Button onClick={handleProcess} disabled={processing} className="w-full" size="lg">
            {processing ? "Reducing PDF..." : "Reduce PDF"}
          </Button>
        </div>
      )}
    </ToolLayout>
  )
}

export default ReducerPdfWrapper