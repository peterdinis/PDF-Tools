"use client";

import dynamic from "next/dynamic";

const ExtractImagesWrapper = dynamic(
  () => import("@/components/pdfs/extract-images/ExtractImagesWrapper"),
  { ssr: false },
);

export default function ExtractImagesPage() {
  return <ExtractImagesWrapper />;
}
