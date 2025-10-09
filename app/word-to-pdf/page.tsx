"use client"

import dynamic from "next/dynamic";

const WordToPdfWrapper = dynamic(
  () => import("@/components/pdfs/pdf-to-jpg/PdfToJpgWrapper"),
  { ssr: false }
);

export default function WordToPdfPage() {
  return <WordToPdfWrapper />;
}