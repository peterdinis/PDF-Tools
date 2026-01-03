import UnlockWrapper from "@/components/pdfs/unlock/UnlockWrapper";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Unlock PDF - Remove PDF Password",
    description: "Remove passwords and security from protected PDF files.",
};

export default function UnlockPage() {
    return <UnlockWrapper />;
}
