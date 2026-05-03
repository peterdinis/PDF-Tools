"use client";

import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-xl">
        <CardHeader className="space-y-4">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl">Something went wrong</CardTitle>
            <CardDescription>
              We could not complete your request. Please try again or go back to all tools.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error?.message && (
            <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Error:</span> {error.message}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button onClick={reset} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                Back to tools
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}