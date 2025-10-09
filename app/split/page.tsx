"use client"

import dynamic from "next/dynamic";

const SplitWrapper = dynamic(
  () => import("@/components/pdfs/split/SplitPDFWrapper"),
  { ssr: false }
);

export default function SplitPdfPage() {
  return <SplitWrapper />;
}