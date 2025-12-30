"use client";

import dynamic from "next/dynamic";

const SignWrapper = dynamic(
  () => import("@/components/pdfs/sign/SignWrapper"),
  { ssr: false },
);

export default function SignPdfPage() {
  return <SignWrapper />;
}
