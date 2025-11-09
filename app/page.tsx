import { ScreenshotUpload } from "@/components/screenshot-upload";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Message Snitch
          </h1>
          <p className="text-muted-foreground text-lg">
            Upload a screenshot of messages and let AI analyze who was wrong,
            gave unsolicited advice, or was being rude.
          </p>
        </div>
        <ScreenshotUpload />
      </main>
    </div>
  );
}
