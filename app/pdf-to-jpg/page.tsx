"use client"

import dynamic from "next/dynamic";

const PdfToJgWrapper = dynamic(
  () => import("@/components/pdfs/pdf-to-jpg/PdfToJpgWrapper"),
  { ssr: false }
);

export default function ExcelToPdfPage() {
  return <PdfToJgWrapper />;
}