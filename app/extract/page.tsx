"use client"

import dynamic from "next/dynamic";

const ExtractWrapper = dynamic(
  () => import("../../components/pdfs/extract/ExtractWrapper"),
  { ssr: false } 
);

export default function Page() {
  return <ExtractWrapper />;
}