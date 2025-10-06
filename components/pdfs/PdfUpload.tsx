"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PDFUploadProps {
  files?: File[];
  onFilesChange?: (files: File[]) => void;
  onFilesSelected?: (files: File[]) => void;
  acceptedFileTypes?: string;
  maxFiles?: number;
  multiple?: boolean;
}

export default function PdfUpload({
  files = [],
  onFilesChange,
  onFilesSelected,
  acceptedFileTypes = ".pdf",
  maxFiles = 1,
  multiple = false,
}: PDFUploadProps) {
  const getAcceptObject = (types: string) => {
    const typeArray = types.split(",").map((t) => t.trim());
    const acceptObj: Record<string, string[]> = {};

    typeArray.forEach((type) => {
      if (type === ".pdf") {
        acceptObj["application/pdf"] = [".pdf"];
      } else if (type.includes(".doc")) {
        acceptObj["application/msword"] = [".doc"];
        acceptObj[
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ] = [".docx"];
      } else if (type.includes(".ppt")) {
        acceptObj["application/vnd.ms-powerpoint"] = [".ppt"];
        acceptObj[
          "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        ] = [".pptx"];
      } else if (type.includes(".xls")) {
        acceptObj["application/vnd.ms-excel"] = [".xls"];
        acceptObj[
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ] = [".xlsx"];
      } else if (type.includes(".jpg") || type.includes(".jpeg")) {
        acceptObj["image/jpeg"] = [".jpg", ".jpeg"];
      } else if (type.includes(".png")) {
        acceptObj["image/png"] = [".png"];
      } else if (type.includes(".html") || type.includes(".htm")) {
        acceptObj["text/html"] = [".html", ".htm"];
      }
    });

    return acceptObj;
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles =
        maxFiles === 1 ? acceptedFiles : [...files, ...acceptedFiles];
      const limitedFiles = maxFiles ? newFiles.slice(0, maxFiles) : newFiles;
      if (onFilesChange) {
        onFilesChange(limitedFiles);
      }
      if (onFilesSelected) {
        onFilesSelected(limitedFiles);
      }
    },
    [files, maxFiles, onFilesChange, onFilesSelected],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: getAcceptObject(acceptedFileTypes),
    multiple: multiple || maxFiles > 1,
    maxFiles,
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    if (onFilesChange) {
      onFilesChange(newFiles);
    }
    if (onFilesSelected) {
      onFilesSelected(newFiles);
    }
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-secondary/50",
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          {isDragActive ? (
            <p className="text-lg font-medium">Drop your files here...</p>
          ) : (
            <>
              <div>
                <p className="text-lg font-medium mb-1">Select files</p>
                <p className="text-sm text-muted-foreground">
                  or drag and drop them here
                </p>
              </div>
              <Button type="button" variant="default">
                Select files
              </Button>
            </>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Selected Files:
          </h3>
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 bg-secondary rounded-lg"
            >
              <div className="flex items-center gap-3">
                <File className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
