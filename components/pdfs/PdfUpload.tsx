"use client";

import { useCallback, useRef, useEffect } from "react";
import { FilePond } from "react-filepond";
import type { FilePondFile } from "filepond";

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
  const pondRef = useRef<FilePond | null>(null);

  const getAcceptedFileTypes = (types: string): string[] => {
    // Default to PDF-only if not specified or if only PDF is requested
    if (types === ".pdf" || types === "") {
      return ["application/pdf"];
    }

    // Parse other file types if needed
    const typeArray = types.split(",").map((t) => t.trim());
    const acceptedTypes: string[] = [];

    typeArray.forEach((type) => {
      if (type === ".pdf") {
        acceptedTypes.push("application/pdf");
      } else if (type.includes(".doc")) {
        acceptedTypes.push("application/msword");
        acceptedTypes.push(
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        );
      } else if (type.includes(".ppt")) {
        acceptedTypes.push("application/vnd.ms-powerpoint");
        acceptedTypes.push(
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        );
      } else if (type.includes(".xls")) {
        acceptedTypes.push("application/vnd.ms-excel");
        acceptedTypes.push(
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
      } else if (type.includes(".jpg") || type.includes(".jpeg")) {
        acceptedTypes.push("image/jpeg");
      } else if (type.includes(".png")) {
        acceptedTypes.push("image/png");
      } else if (type.includes(".html") || type.includes(".htm")) {
        acceptedTypes.push("text/html");
      }
    });

    return acceptedTypes.length > 0 ? acceptedTypes : ["application/pdf"];
  };

  const extractFiles = useCallback(
    (fileItems: FilePondFile[]): File[] => {
      const extractedFiles: File[] = [];

      fileItems.forEach((fileItem) => {
        // Try different ways to get the file
        if (fileItem.file instanceof File) {
          extractedFiles.push(fileItem.file);
        } else if (fileItem.source instanceof File) {
          extractedFiles.push(fileItem.source);
        } else if (fileItem.getFile instanceof Function) {
          const file = fileItem.getFile();
          if (file instanceof File) {
            extractedFiles.push(file);
          }
        }
      });

      return extractedFiles;
    },
    [],
  );

  const notifyFiles = useCallback(
    (fileItems: FilePondFile[]) => {
      const extractedFiles = extractFiles(fileItems);
      const limitedFiles = maxFiles
        ? extractedFiles.slice(0, maxFiles)
        : extractedFiles;

      if (onFilesChange) {
        onFilesChange(limitedFiles);
      }
      if (onFilesSelected) {
        onFilesSelected(limitedFiles);
      }
    },
    [maxFiles, onFilesChange, onFilesSelected, extractFiles],
  );

  const handleUpdateFiles = useCallback(
    (fileItems: FilePondFile[]) => {
      notifyFiles(fileItems);
    },
    [notifyFiles],
  );

  const validatePDFFile = useCallback(async (file: File): Promise<string | true> => {
    // Check file extension
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return "File must have .pdf extension";
    }

    // Check MIME type (if available)
    if (file.type && file.type !== "application/pdf") {
      return "File must be a PDF document";
    }

    // Validate PDF magic bytes (PDF files start with %PDF)
    try {
      const arrayBuffer = await file.slice(0, 4).arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const header = String.fromCharCode(...uint8Array);
      
      // PDF files should start with "%PDF"
      if (header !== "%PDF") {
        return "Invalid PDF file. File does not appear to be a valid PDF document.";
      }
    } catch (error) {
      console.error("Error validating PDF:", error);
      return "Error validating PDF file";
    }

    return true;
  }, []);

  const handleAddFile = useCallback(
    async (error: Error | null, fileItem: FilePondFile) => {
      if (error) {
        console.error("FilePond add file error:", error);
        return;
      }

      // Validate that the file is actually a PDF
      const file = fileItem.file as File;
      if (file) {
        const validationResult = await validatePDFFile(file);
        if (validationResult !== true) {
          // Remove invalid file and show error
          if (pondRef.current) {
            pondRef.current.removeFile(fileItem.id);
          }
          // The error will be shown by FilePond's built-in error handling
          return;
        }
      }

      // Wait a bit for file to be fully processed
      setTimeout(() => {
        if (pondRef.current) {
          const allFiles = pondRef.current.getFiles();
          notifyFiles(allFiles);
        }
      }, 50);
    },
    [notifyFiles, validatePDFFile],
  );

  const handleFileValidateType = useCallback(
    (file: File, type: string): boolean => {
      // Additional validation: check if it's actually a PDF
      if (type !== "application/pdf") {
        return false;
      }
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        return false;
      }
      return true;
    },
    [],
  );

  const handleRemoveFile = useCallback(
    () => {
      // Immediately notify when file is removed
      if (pondRef.current) {
        const allFiles = pondRef.current.getFiles();
        notifyFiles(allFiles);
      }
    },
    [notifyFiles],
  );

  // Reset FilePond when files prop is cleared externally
  useEffect(() => {
    if (pondRef.current && files.length === 0) {
      const currentFiles = pondRef.current.getFiles();
      if (currentFiles.length > 0) {
        pondRef.current.removeFiles();
      }
    }
  }, [files.length]);

  const acceptedTypes = getAcceptedFileTypes(acceptedFileTypes);

  return (
    <div className="w-full">
      <style jsx global>{`
        .filepond--root {
          margin-bottom: 0;
        }
        .filepond--panel-root {
          background-color: hsl(var(--secondary));
          border: 2px dashed hsl(var(--border));
          border-radius: calc(var(--radius) - 2px);
          min-height: 120px;
        }
        .filepond--panel-root:hover {
          border-color: hsl(var(--primary) / 0.5);
          background-color: hsl(var(--secondary) / 0.5);
        }
        .filepond--drop-label {
          color: hsl(var(--foreground));
          font-size: 1rem;
        }
        .filepond--label-action {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
        .filepond--credits {
          display: none;
        }
        .filepond--file {
          background-color: hsl(var(--secondary));
        }
        .filepond--file-status-main {
          color: hsl(var(--foreground));
        }
        .filepond--file-status-sub {
          color: hsl(var(--muted-foreground));
        }
        .filepond--file-action-button {
          background-color: hsl(var(--destructive));
          color: hsl(var(--destructive-foreground));
        }
        .filepond--file-action-button:hover {
          background-color: hsl(var(--destructive) / 0.9);
        }
        .filepond--file-info-main {
          color: hsl(var(--foreground));
        }
        .filepond--file-info-sub {
          color: hsl(var(--muted-foreground));
        }
      `}</style>
      <FilePond
        ref={pondRef}
        onupdatefiles={handleUpdateFiles}
        onaddfile={handleAddFile}
        onremovefile={handleRemoveFile}
        fileValidateTypeDetectType={handleFileValidateType}
        allowMultiple={multiple || (maxFiles ? maxFiles > 1 : false)}
        maxFiles={maxFiles || undefined}
        acceptedFileTypes={acceptedTypes}
        labelIdle='Drag & Drop your PDF files or <span class="filepond--label-action">Browse</span>'
        labelFileProcessing="Processing"
        labelFileProcessingComplete="Processing complete"
        labelFileProcessingAborted="Processing aborted"
        labelFileProcessingError="Error during processing"
        labelFileProcessingRevertError="Error during revert"
        labelFileRemoveError="Error during remove"
        labelTapToCancel="tap to cancel"
        labelTapToRetry="tap to retry"
        labelTapToUndo="tap to undo"
        labelButtonRemoveItem="Remove"
        labelButtonAbortItemLoad="Abort"
        labelButtonRetryItemLoad="Retry"
        labelButtonAbortItemProcessing="Cancel"
        labelButtonStartItemLoad="Load"
        labelButtonUndoItemLoad="Undo"
        labelButtonRetryItemProcessing="Retry"
        labelButtonStartItemProcessing="Process"
        labelButtonUndoItemProcessing="Undo"
        labelFileLoading="Loading"
        labelFileLoadError="Error during load"
        labelFileSizeNotAvailable="Size not available"
        labelFileTypeNotAllowed="Only PDF files are allowed. Please select a valid PDF document."
        instantUpload={false}
        storeAsFile={true}
        allowRevert={false}
        checkValidity={true}
      />
    </div>
  );
}
