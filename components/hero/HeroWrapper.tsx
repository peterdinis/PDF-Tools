"use client";

import { FC } from "react";
import Navigation from "../shared/Navigation";
import { ToolsGrid } from "../tools/ToolsGrid";
import { motion } from "framer-motion";

const HeroWrapper: FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        <section className="relative overflow-hidden py-24 md:py-32">
          {/* Background Decorative Element */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 opacity-30 blur-3xl transition-opacity animate-pulse">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/20 rounded-full" />
          </div>

          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <h1 className="text-5xl md:text-7xl font-black tracking-tight text-balance leading-[1.1]">
                  Every tool you need to <span className="text-primary italic">master</span> PDFs
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
                  Professional-grade PDF tools, simplified for everyone. 100% free, 
                  privacy-focused, and incredibly fast. Merge, split, compress, and edit in seconds.
                </p>
              </motion.div>
            </div>
          </div>
        </section>
        <ToolsGrid />
      </main>
    </div>
  );
};

export default HeroWrapper;
