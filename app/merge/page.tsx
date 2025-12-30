"use client";

import dynamic from "next/dynamic";

const MergeWrapper = dynamic(
  () => import("@/components/pdfs/merge/MergePDFWrapper"),
  { ssr: false },
);

export default function MergePdfPage() {
  return <MergeWrapper />;
}
