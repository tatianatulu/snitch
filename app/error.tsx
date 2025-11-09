"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log the error for debugging
  console.error("Error boundary caught:", error);
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <div className="p-4 bg-destructive/10 rounded-md space-y-2">
          <p className="text-sm text-destructive font-mono break-words">
            {error.message || "An unexpected error occurred"}
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}
          {error.stack && (
            <details className="mt-2">
              <summary className="text-xs text-muted-foreground cursor-pointer">
                Stack trace
              </summary>
              <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto max-h-40">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
        <div className="space-y-2">
          <button
            onClick={reset}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try again
          </button>
          <p className="text-xs text-muted-foreground text-center">
            If this persists, check Vercel logs for more details
          </p>
        </div>
      </div>
    </div>
  );
}

