import { Suspense } from "react";
import dynamic from "next/dynamic";

// Dynamically import the component to avoid SSR issues
const ScreenshotUpload = dynamic(
  () => import("@/components/screenshot-upload").then((mod) => ({ default: mod.ScreenshotUpload })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    ),
  }
);

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Message Snitch
          </h1>
          <p className="text-muted-foreground text-lg">
            Upload a screenshot or paste text of messages to analyze who was wrong,
            gave unsolicited advice, or was being rude.
          </p>
        </div>
        <Suspense fallback={
          <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        }>
          <ScreenshotUpload />
        </Suspense>
      </main>
    </div>
  );
}
