"use client";

import dynamic from "next/dynamic";

const PdfMetadataWrapper = dynamic(
  () => import("@/components/pdfs/pdf-metadata/PdfMetadataWrapper"),
  { ssr: false },
);

export default function PdfMetadataPage() {
  return <PdfMetadataWrapper />;
}
