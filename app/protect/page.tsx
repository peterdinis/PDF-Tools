"use client"

import dynamic from "next/dynamic";

const ProtectWrapper = dynamic(
  () => import("@/components/pdfs/protect/ProtectWrapper"),
  { ssr: false }
);

export default function ProtectPdfPage() {
  return <ProtectWrapper />;
}