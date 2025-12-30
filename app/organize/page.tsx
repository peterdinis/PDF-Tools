"use client";

import dynamic from "next/dynamic";

const OrganizeWrapper = dynamic(
  () => import("@/components/pdfs/organize/OrganizeWrapper"),
  { ssr: false },
);

export default function OrganizePdfPage() {
  return <OrganizeWrapper />;
}
