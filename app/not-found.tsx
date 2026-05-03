"use client";

import Link from "next/link";
import { Home, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-xl">
        <CardHeader className="space-y-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <SearchX className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl">Page not found</CardTitle>
            <CardDescription>
              The page or tool you requested does not exist anymore, or the URL is incorrect.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Button asChild className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Back to all tools
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
