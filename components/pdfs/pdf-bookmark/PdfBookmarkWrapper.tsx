"use client";

import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, BookOpen, Loader2, AlertCircle, X, Plus, Trash2 } from "lucide-react";
import { downloadFromUrl } from "@/lib/download";
import { PDFDocument } from "pdf-lib";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ToolLayout from "@/components/tools/ToolLayout";
import PdfUpload from "../PdfUpload";

interface Bookmark {
  title: string;
  pageNumber: number;
}

const PdfBookmarkWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookmarkedPdf, setBookmarkedPdf] = useState<{ url: string } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [newBookmark, setNewBookmark] = useState<Bookmark>({
    title: "",
    pageNumber: 1,
  });

  const handleFileSelected = async (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setError(null);
    setBookmarkedPdf(null);
    setBookmarks([]);
    setNewBookmark({ title: "", pageNumber: 1 });

    if (selectedFiles.length > 0) {
      try {
        const file = selectedFiles[0];
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        setTotalPages(pdfDoc.getPageCount());
      } catch (err) {
        console.error("Error loading PDF:", err);
        setError("Failed to load PDF file");
      }
    }
  };

  const handleAddBookmark = () => {
    if (
      newBookmark.title.trim() &&
      newBookmark.pageNumber > 0 &&
      newBookmark.pageNumber <= totalPages
    ) {
      setBookmarks([
        ...bookmarks,
        {
          title: newBookmark.title.trim(),
          pageNumber: newBookmark.pageNumber,
        },
      ]);
      setNewBookmark({ title: "", pageNumber: bookmarks.length + 2 });
    }
  };

  const handleRemoveBookmark = (index: number) => {
    setBookmarks(bookmarks.filter((_, i) => i !== index));
  };

  const handleAddBookmarks = async () => {
    if (files.length === 0 || bookmarks.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const file = files[0];
      if (file.size > 50 * 1024 * 1024) {
        throw new Error("File size too large. Maximum size is 50MB.");
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      // Sort bookmarks by page number
      const sortedBookmarks = [...bookmarks].sort(
        (a, b) => a.pageNumber - b.pageNumber,
      );

      // Create outline structure using pdf-lib's low-level API
      const outlineDictRef = pdfDoc.context.register(
        pdfDoc.context.obj({
          Type: "Outlines",
          Count: sortedBookmarks.length,
        }),
      );

      const bookmarkRefs: any[] = [];

      // Create bookmark entries
      for (let i = 0; i < sortedBookmarks.length; i++) {
        const bookmark = sortedBookmarks[i];
        const targetPage = pdfDoc.getPage(bookmark.pageNumber - 1);
        const targetPageRef = pdfDoc.context.get(targetPage.ref);

        const bookmarkDict = pdfDoc.context.obj({
          Title: bookmark.title,
          Parent: outlineDictRef,
          Dest: [targetPageRef, "Fit"],
        });

        const bookmarkRef = pdfDoc.context.register(bookmarkDict);
        bookmarkRefs.push(bookmarkRef);

        // Set Next/Prev references
        if (i > 0) {
          const prevBookmark = pdfDoc.context.lookup(bookmarkRefs[i - 1]);
          prevBookmark.set("Next", bookmarkRef);
          bookmarkDict.set("Prev", bookmarkRefs[i - 1]);
        }
      }

      // Set First and Last
      if (bookmarkRefs.length > 0) {
        const outlineDict = pdfDoc.context.lookup(outlineDictRef);
        outlineDict.set("First", bookmarkRefs[0]);
        outlineDict.set("Last", bookmarkRefs[bookmarkRefs.length - 1]);
      }

      // Add outline to document catalog
      const catalog = pdfDoc.catalog;
      catalog.set("Outlines", outlineDictRef);

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);

      setBookmarkedPdf({ url });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to add bookmarks to PDF. Please try again.";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!bookmarkedPdf) return;

    setIsDownloading(true);
    try {
      const filename = `bookmarked_${Date.now()}.pdf`;
      const success = await downloadFromUrl(bookmarkedPdf.url, filename);

      if (!success) {
        setError("Failed to download file. Please try again.");
      }
    } catch (error) {
      setError("Failed to download file. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setBookmarkedPdf(null);
    setError(null);
    setBookmarks([]);
    setNewBookmark({ title: "", pageNumber: 1 });
    setTotalPages(0);
  };

  return (
    <ToolLayout
      title="PDF Bookmark"
      showUpload={true}
      description="Add bookmarks and navigation outlines to PDF documents for easy navigation."
    >
      <Card>
        <CardContent className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div className="text-red-700 text-sm">
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          {!bookmarkedPdf ? (
            <>
              <PdfUpload
                onFilesSelected={handleFileSelected}
                multiple={false}
              />

              {files.length > 0 && totalPages > 0 && (
                <div className="mt-6 space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Total pages: <strong>{totalPages}</strong>
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Add Bookmark</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="bookmark-title">Bookmark Title</Label>
                        <Input
                          id="bookmark-title"
                          value={newBookmark.title}
                          onChange={(e) =>
                            setNewBookmark({
                              ...newBookmark,
                              title: e.target.value,
                            })
                          }
                          placeholder="Enter bookmark title"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleAddBookmark();
                            }
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor="bookmark-page">Page Number</Label>
                        <Input
                          id="bookmark-page"
                          type="number"
                          min="1"
                          max={totalPages}
                          value={newBookmark.pageNumber}
                          onChange={(e) =>
                            setNewBookmark({
                              ...newBookmark,
                              pageNumber: parseInt(e.target.value) || 1,
                            })
                          }
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleAddBookmark}
                      variant="outline"
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Bookmark
                    </Button>
                  </div>

                  {bookmarks.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold">
                        Bookmarks ({bookmarks.length})
                      </h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {bookmarks.map((bookmark, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{bookmark.title}</p>
                              <p className="text-sm text-muted-foreground">
                                Page {bookmark.pageNumber}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveBookmark(index)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleAddBookmarks}
                    disabled={isProcessing || bookmarks.length === 0}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding bookmarks...
                      </div>
                    ) : (
                      <>
                        <BookOpen className="w-4 h-4 mr-2" />
                        Add Bookmarks to PDF ({bookmarks.length})
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Bookmarks Added Successfully!
              </h3>
              <p className="text-muted-foreground mb-6">
                Your PDF now has {bookmarks.length} bookmark
                {bookmarks.length !== 1 ? "s" : ""} for easy navigation.
              </p>

              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleDownload}
                  size="lg"
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleReset} size="lg">
                  Add Bookmarks to Another PDF
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </ToolLayout>
  );
};

export default PdfBookmarkWrapper;
