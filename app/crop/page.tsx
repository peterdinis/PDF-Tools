"use client";

import dynamic from "next/dynamic";

const CropWrapper = dynamic(
  () => import("@/components/pdfs/crop/CropWrapper"),
  { ssr: false },
);

export default function CropPdfPage() {
  return <CropWrapper />;
}
