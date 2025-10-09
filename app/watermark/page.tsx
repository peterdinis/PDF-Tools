"use client"

import dynamic from "next/dynamic";

const WatermakWrapper = dynamic(
  () => import("@/components/pdfs/watermark/WatermarkWrapper"),
  { ssr: false }
);

export default function WatermarkPdfPage() {
  return <WatermakWrapper />;
}