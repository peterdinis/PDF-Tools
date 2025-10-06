import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
  return (
    <Link href={href}>
      <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer border-2 hover:border-primary/50">
        <CardContent className="p-6">
          <div className="flex flex-col gap-3">
            <div
              className={cn(
                "w-12 h-12 rounded-lg bg-secondary flex items-center justify-center",
                color,
              )}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">{name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
