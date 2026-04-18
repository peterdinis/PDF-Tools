"use client";

import Link from "next/link";
import { FileText, Menu, X } from "lucide-react";
import { FC, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModeToggle } from "./ModeToggle";

const Navigation: FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic">
              PDF<span className="text-primary">Crafter</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">Tools</Link>
            <div className="w-px h-6 bg-border mx-2" />
            <ModeToggle />
          </nav>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors focus:outline-none"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden px-4 pb-6 flex flex-col gap-4 bg-background/80 backdrop-blur-xl border-b"
          >
            <div className="pt-4 flex flex-col gap-4">
              <Link href="/" className="text-lg font-semibold py-2">Tools</Link>  
              <div className="pt-2">
                <ModeToggle />
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navigation;
