"use client"

import dynamic from "next/dynamic";

const PdfToPowerPointWrapper = dynamic(
  () => import("@/components/pdfs/pdf-to-powerpoint/PDFToPowerpointWrapper"),
  { ssr: false }
);

export default function ExcelToPdfPage() {
  return <PdfToPowerPointWrapper />;
}