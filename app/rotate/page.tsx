"use client";

import dynamic from "next/dynamic";

const RotateWrapper = dynamic(
  () => import("@/components/pdfs/rotate/RotateWrapper"),
  { ssr: false },
);

export default function RotatePdfPage() {
  return <RotateWrapper />;
}
