import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const Loading: React.FC = () => {
  return (
    <div className="flex h-screen w-full">
      {/* Sidebar skeleton */}
      <div className="w-64 border-r p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-9 rounded" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar skeleton */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-20" />
            </div>
            <div className="flex items-center gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-9 w-9 rounded" />
              ))}
            </div>
          </div>
        </div>

        {/* PDF viewer skeleton */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="relative">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="p-0">
                  <Skeleton className="h-200 w-full" />
                </CardContent>
                <div className="absolute bottom-4 right-4">
                  <Skeleton className="h-8 w-16" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Pagination skeleton */}
        <div className="border-t p-4">
          <div className="flex items-center justify-center gap-4">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </div>

      {/* Right sidebar skeleton */}
      <div className="w-16 border-l p-4 flex flex-col items-center gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-9 w-9 rounded" />
        ))}
      </div>
    </div>
  );
};

export default Loading;