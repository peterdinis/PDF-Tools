"use client"

import dynamic from "next/dynamic";

const HtmlToPdfWrapper = dynamic(
  () => import("@/components/pdfs/html-to-pdf/HtmlToPdfWrapper"),
  { ssr: false }
);

export default function HtmlToPdfPage() {
  return <HtmlToPdfWrapper />;
}