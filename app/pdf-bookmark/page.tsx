"use client";

import dynamic from "next/dynamic";

const PdfBookmarkWrapper = dynamic(
  () => import("@/components/pdfs/pdf-bookmark/PdfBookmarkWrapper"),
  { ssr: false },
);

export default function PdfBookmarkPage() {
  return <PdfBookmarkWrapper />;
}
