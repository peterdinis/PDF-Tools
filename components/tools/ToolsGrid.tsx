import {
  Combine,
  Split,
  Minimize2,
  FileText,
  Presentation,
  Sheet,
  FileImage,
  Edit3,
  Lock,
  Unlock,
  RotateCw,
  Droplet,
  FileSignature,
  Crop,
  Grid3x3,
  FileCheck,
  ScanLine,
  Hash,
  FileDown,
} from "lucide-react";
import { ToolCard } from "./ToolCard";

const tools = [
  {
    name: "Merge PDF",
    description:
      "Combine PDFs in the order you want with the easiest PDF merger available.",
    icon: Combine,
    href: "/merge",
    color: "text-red-500",
  },
  {
    name: "Split PDF",
    description:
      "Separate one page or a whole set for easy conversion into independent PDF files.",
    icon: Split,
    href: "/split",
    color: "text-orange-500",
  },
  {
    name: "Compress PDF",
    description: "Reduce file size while optimizing for maximal PDF quality.",
    icon: Minimize2,
    href: "/compress",
    color: "text-green-500",
  },
  {
    name: "PDF to Word",
    description:
      "Easily convert your PDF files into easy to edit DOC and DOCX documents.",
    icon: FileText,
    href: "/pdf-to-word",
    color: "text-blue-500",
  },
  {
    name: "PDF to PowerPoint",
    description:
      "Turn your PDF files into easy to edit PPT and PPTX slideshows.",
    icon: Presentation,
    href: "/pdf-to-powerpoint",
    color: "text-red-500",
  },
  {
    name: "PDF to Excel",
    description:
      "Pull data straight from PDFs into Excel spreadsheets in a few short seconds.",
    icon: Sheet,
    href: "/pdf-to-excel",
    color: "text-green-500",
  },
  {
    name: "Word to PDF",
    description:
      "Make DOC and DOCX files easy to read by converting them to PDF.",
    icon: FileText,
    href: "/word-to-pdf",
    color: "text-blue-500",
  },
  {
    name: "PowerPoint to PDF",
    description:
      "Make PPT and PPTX slideshows easy to view by converting them to PDF.",
    icon: Presentation,
    href: "/powerpoint-to-pdf",
    color: "text-orange-500",
  },
  {
    name: "Excel to PDF",
    description:
      "Make EXCEL spreadsheets easy to read by converting them to PDF.",
    icon: Sheet,
    href: "/excel-to-pdf",
    color: "text-green-500",
  },
  {
    name: "Edit PDF",
    description:
      "Add text, images, shapes or freehand annotations to a PDF document.",
    icon: Edit3,
    href: "/edit",
    color: "text-purple-500",
  },
  {
    name: "PDF to JPG",
    description:
      "Convert each PDF page into a JPG or extract all images contained in a PDF.",
    icon: FileImage,
    href: "/pdf-to-jpg",
    color: "text-yellow-500",
  },
  {
    name: "JPG to PDF",
    description:
      "Convert JPG images to PDF in seconds. Easily adjust orientation and margins.",
    icon: FileImage,
    href: "/jpg-to-pdf",
    color: "text-green-500",
  },
  {
    name: "Sign PDF",
    description: "Sign yourself or request electronic signatures from others.",
    icon: FileSignature,
    href: "/sign",
    color: "text-blue-500",
  },
  {
    name: "Watermark PDF",
    description:
      "Stamp an image or text over your PDF in seconds. Choose the typography, transparency and position.",
    icon: Droplet,
    href: "/watermark",
    color: "text-purple-500",
  },
  {
    name: "Rotate PDF",
    description:
      "Rotate your PDFs the way you need them. You can even rotate multiple PDFs at once!",
    icon: RotateCw,
    href: "/rotate",
    color: "text-orange-500",
  },
  {
    name: "Unlock PDF",
    description:
      "Remove PDF password security, giving you the freedom to use your PDFs as you want.",
    icon: Unlock,
    href: "/unlock",
    color: "text-blue-500",
  },
  {
    name: "Protect PDF",
    description:
      "Protect PDF files with a password. Encrypt PDF documents to prevent unauthorized access.",
    icon: Lock,
    href: "/protect",
    color: "text-red-500",
  },
  {
    name: "Organize PDF",
    description:
      "Sort pages of your PDF file however you like. Delete PDF pages or add PDF pages to your document at any time!",
    icon: Grid3x3,
    href: "/organize",
    color: "text-green-500",
  },
  {
    name: "Repair PDF",
    description:
      "Repair a damaged PDF and recover data from corrupt PDF. Fix PDF files with our Repair PDF tool.",
    icon: FileCheck,
    href: "/repair",
    color: "text-orange-500",
  },
  {
    name: "Scan to PDF",
    description:
      "Capture document scans from any mobile device and automatically convert them to PDF files.",
    icon: ScanLine,
    href: "/scan",
    color: "text-blue-500",
  },
  {
    name: "Page Numbers",
    description:
      "Add page numbers into PDFs with ease. Choose your positions, dimensions, typography.",
    icon: Hash,
    href: "/page-numbers",
    color: "text-purple-500",
  },
  {
    name: "Crop PDF",
    description:
      "Crop or remove margins from PDF. Choose the size of your PDF files and make them exactly what you need.",
    icon: Crop,
    href: "/crop",
    color: "text-pink-500",
  },
  {
    name: "Reduce PDF",
    description:
      "Reduce file size and optimize PDF documents to decrease file size.",
    icon: Minimize2,
    href: "/reduce",
    color: "text-green-500",
  },
  {
    name: "Extract PDF",
    description:
      "Extract images, text and pages from PDF files. Get all the data you need from your PDF.",
    icon: FileDown,
    href: "/extract",
    color: "text-indigo-500",
  },
];

export function ToolsGrid() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tools.map((tool) => (
            <ToolCard key={tool.name} {...tool} />
          ))}
        </div>
      </div>
    </section>
  );
}
