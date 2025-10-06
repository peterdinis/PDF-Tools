"use client"

import Link from "next/link"
import { FileText, Menu, X } from "lucide-react"
import { FC, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const Navigation: FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">PDFTools</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#" className="text-sm font-medium hover:text-primary transition-colors">
              Merge PDF
            </Link>
            <Link href="#" className="text-sm font-medium hover:text-primary transition-colors">
              Split PDF
            </Link>
            <Link href="#" className="text-sm font-medium hover:text-primary transition-colors">
              Compress PDF
            </Link>
            <Link href="#" className="text-sm font-medium hover:text-primary transition-colors">
              Convert PDF
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded focus:outline-none"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden px-4 pb-4 flex flex-col gap-4 bg-background border-b"
          >
            <Link
              href="#"
              className="text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Merge PDF
            </Link>
            <Link
              href="#"
              className="text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Split PDF
            </Link>
            <Link
              href="#"
              className="text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Compress PDF
            </Link>
            <Link
              href="#"
              className="text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Convert PDF
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navigation
