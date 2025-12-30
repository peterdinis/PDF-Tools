"use client";

import dynamic from "next/dynamic";

const EditWrapper = dynamic(
  () => import("@/components/pdfs/edit-pdf/EditPdfWrapper"),
  { ssr: false },
);

export default function EditPdfPage() {
  return <EditWrapper />;
}
