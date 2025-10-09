"use client"

import dynamic from "next/dynamic";

const PdfToWordWrapper = dynamic(
  () => import("@/components/pdfs/pdf-to-word/PDFToWordWrapper"),
  { ssr: false }
);

export default function PdfToWordPage() {
  return <PdfToWordWrapper />;
}