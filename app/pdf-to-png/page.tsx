"use client";

import dynamic from "next/dynamic";

const PdfToPngWrapper = dynamic(
  () => import("@/components/pdfs/pdf-to-png/PdfToPngWrapper"),
  { ssr: false },
);

export default function PdfToPngPage() {
  return <PdfToPngWrapper />;
}
