"use client"

import dynamic from "next/dynamic";

const ScanWrapper = dynamic(
  () => import("@/components/pdfs/scan/ScanWrapper"),
  { ssr: false }
);

export default function ScanPdfPage() {
  return <ScanWrapper />;
}