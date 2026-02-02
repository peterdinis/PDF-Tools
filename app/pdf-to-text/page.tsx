"use client";

import dynamic from "next/dynamic";

const PdfToTextWrapper = dynamic(
  () => import("@/components/pdfs/pdf-to-text/PdfToTextWrapper"),
  { ssr: false },
);

export default function PdfToTextPage() {
  return <PdfToTextWrapper />;
}
