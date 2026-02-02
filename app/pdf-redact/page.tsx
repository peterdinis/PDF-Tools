"use client";

import dynamic from "next/dynamic";

const PdfRedactWrapper = dynamic(
  () => import("@/components/pdfs/pdf-redact/PdfRedactWrapper"),
  { ssr: false },
);

export default function PdfRedactPage() {
  return <PdfRedactWrapper />;
}
