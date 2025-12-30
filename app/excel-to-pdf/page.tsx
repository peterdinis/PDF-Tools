"use client";

import dynamic from "next/dynamic";

const ExcelToPdfWrapper = dynamic(
  () => import("@/components/pdfs/excel-to-pdf/ExcelToPdfWrapper"),
  { ssr: false },
);

export default function ExcelToPdfPage() {
  return <ExcelToPdfWrapper />;
}
