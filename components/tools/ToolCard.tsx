"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ToolCardProps {
  name: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
}

export function ToolCard({
  name,
  description,
  icon: Icon,
  href,
  color,
}: ToolCardProps) {
  const pathname = usePathname();
  const isSelected = pathname === href;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Link href={href} aria-current={isSelected ? "page" : undefined}>
        <Card
          className={cn(
            "h-full glass-card hover:bg-card/60 cursor-pointer overflow-hidden group transition-all",
            isSelected && "ring-2 ring-primary/60 shadow-lg shadow-primary/10",
          )}
        >
          <CardContent className="p-7">
            <div className="flex flex-col gap-4">
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                  "bg-secondary/50 group-hover:bg-primary group-hover:text-primary-foreground shadow-sm",
                  color,
                )}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-xl tracking-tight group-hover:text-primary transition-colors">
                  {name}
                </h3>
                {isSelected && (
                  <p className="text-xs text-primary font-medium">Currently selected</p>
                )}
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {description}
                </p>
              </div>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </Card>
      </Link>
    </motion.div>
  );
}
