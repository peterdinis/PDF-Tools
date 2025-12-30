"use client";

import dynamic from "next/dynamic";

const PageNumbersPdfWrapper = dynamic(
  () => import("@/components/pdfs/page-numbers/PageNumbersPdfWrapper"),
  { ssr: false },
);

export default function PageNumbersPdfPage() {
  return <PageNumbersPdfWrapper />;
}
