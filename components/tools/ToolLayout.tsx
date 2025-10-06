"use client"

import type { ReactNode } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Navigation from "../shared/Navigation"
import PdfUpload from "../pdfs/PdfUpload"

interface ToolLayoutProps {
  title: string
  description: string
  icon?: ReactNode
  children: ReactNode
  files?: File[]
  onFilesChange?: (files: File[]) => void
  acceptedFileTypes?: string
  maxFiles?: number
  showUpload?: boolean
}

export default function ToolLayout({
  title,
  description,
  icon,
  children,
  files,
  onFilesChange,
  acceptedFileTypes = ".pdf",
  maxFiles = 1,
  showUpload = false,
}: ToolLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to all tools
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            {icon && <div className="text-primary">{icon}</div>}
            <h1 className="text-3xl md:text-4xl font-bold">{title}</h1>
          </div>
          <p className="text-muted-foreground text-lg">{description}</p>
        </div>
        <div className="max-w-4xl mx-auto space-y-6">
          {showUpload && files !== undefined && onFilesChange && (
            <PdfUpload
              files={files}
              onFilesChange={onFilesChange}
              acceptedFileTypes={acceptedFileTypes}
              maxFiles={maxFiles}
            />
          )}
          {children}
        </div>
      </main>
    </div>
  )
}