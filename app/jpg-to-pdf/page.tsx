"use client";

import dynamic from "next/dynamic";

const JpgToPdfWrapper = dynamic(
  () => import("@/components/pdfs/jpg-to-pdf/JpgToPdfWrapper"),
  { ssr: false },
);

export default function JpgToPdfPage() {
  return <JpgToPdfWrapper />;
}
