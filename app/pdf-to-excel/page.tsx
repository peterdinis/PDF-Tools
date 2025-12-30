"use client";

import dynamic from "next/dynamic";

const ExcelWrapper = dynamic(
  () => import("@/components/pdfs/pdf-to-excel/ExcelWrapper"),
  { ssr: false },
);

export default function PdfToExcelPage() {
  return <ExcelWrapper />;
}
