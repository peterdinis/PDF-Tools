"use client"

import dynamic from "next/dynamic";

const PowerPointToPdfWrapper = dynamic(
  () => import("@/components/pdfs/powerpoint-to-pdf/PowerpointToPdfWrapper"),
  { ssr: false }
);

export default function PowerpointToPdfPage() {
  return <PowerPointToPdfWrapper />;
}