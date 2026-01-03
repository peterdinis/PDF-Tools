# PDF Tools - Professional PDF Tools Suite

PDF Tools is a high-performance, privacy-focused web application designed for comprehensive PDF manipulation. Built with Next.js 16 and cutting-edge client-side libraries, it offers a fast, secure, and intuitive experience for all your PDF needs.

## 🚀 Key Features

### 📝 Advanced PDF Editor
- **Rich Elements**: Add text, high-resolution images, and shapes (rectangles, circles, lines).
- **Heading Presets**: Quick-access **H1**, **H2**, and **H3** headings with optimized styling.
- **Smart Tables**: Create complex tables by importing comma-separated data directly into your document.
- **Text Formatting**: Fine-tune your content with **Bold**, *Italic*, and custom font sizes.
- **Layer Management**: Full control over element ordering and visibility.

### 🛠️ PDF Manipulation Tools
- **Merge & Split**: Combine multiple documents or extract specific pages/ranges with ease.
- **Advanced Compression**: Multi-level optimization (Low/Medium/High) to reduce file size while preserving visual quality.
- **Organize & Rotate**: Reorder, delete, or rotate pages using an interactive visual grid.
- **Sign & Watermark**: Secure your documents with hand-drawn, typed, or uploaded signatures and customizable watermarks.
- **Crop & Page Numbers**: Professionally format your documents for printing (A4, Letter, Legal).

### 🔒 Security & Privacy
- **Protect PDF**: Secure your sensitive data with industry-standard password encryption.
- **Unlock PDF**: Remove passwords from protected files instantly with authorized access.
- **Local Processing**: Most operations are performed client-side using `pdf-lib`, ensuring your files never leave your device unless necessary.

### 📸 Capture & Convert
- **Scan to PDF**: Capture documents directly from your device's camera and merge them into professional PDFs.
- **PDF to Image**: Convert pages into high-quality JPGs.
- **Image to PDF**: Create PDF portfolios from your photo collection.
- **Text Extraction**: High-fidelity text extraction for searchable documents.

## 💻 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **PDF Core**: [pdf-lib](https://pdf-lib.js.org/) & [pdfjs-dist](https://mozilla.github.io/pdf.js/)
- **Security Engine**: [node-qpdf2](https://github.com/thefubots/node-qpdf2)
- **UI Architecture**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🛠️ Getting Started

### Prerequisites
- Node.js 20+
- npm / pnpm / yarn

### Installation
1. Clone the repository:
   ```bash
   git clone [repository-url]
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to experience PDF Crafter.

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
