"use client"

import dynamic from "next/dynamic";

const CompressWrapper = dynamic(
  () => import("@/components/pdfs/compress/CompressPDFWrapper"),
  { ssr: false }
);

export default function CompressPdfPage() {
  return <CompressWrapper />;
}