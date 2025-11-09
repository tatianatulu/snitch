"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, Image, FileText } from "lucide-react";
import { analyzeScreenshot, analyzeText, type AnalysisResult } from "@/app/actions/analyze";
import { AnalysisResults } from "@/components/analysis-results";

type InputMode = "image" | "text";

export function ScreenshotUpload() {
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      setFile(selectedFile);
      setError(null);
      setAnalysis(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      if (inputMode === "image") {
        if (!file) {
          setError("Please select an image file");
          setIsAnalyzing(false);
          return;
        }

        // Convert file to base64
        const { base64, mimeType } = await new Promise<{
          base64: string;
          mimeType: string;
        }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            // Extract mime type and base64 data
            const match = result.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              resolve({ base64: match[2], mimeType: match[1] });
            } else {
              reject(new Error("Failed to parse image data"));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const result = await analyzeScreenshot(base64, mimeType);
        setAnalysis(result);
      } else {
        if (!textContent.trim()) {
          setError("Please paste or type the conversation text");
          setIsAnalyzing(false);
          return;
        }

        const result = await analyzeText(textContent.trim());
        setAnalysis(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze";
      setError(errorMessage);
      console.error("Analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setTextContent("");
    setAnalysis(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleModeChange = (mode: InputMode) => {
    setInputMode(mode);
    setFile(null);
    setPreview(null);
    setTextContent("");
    setAnalysis(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Analyze Conversation</CardTitle>
          <CardDescription>
            Upload a screenshot or paste text of messages to analyze who was wrong, gave
            unsolicited advice, or was being rude.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode selector */}
          <div className="flex gap-2 border-b pb-4">
            <Button
              type="button"
              variant={inputMode === "image" ? "default" : "outline"}
              onClick={() => handleModeChange("image")}
              disabled={isAnalyzing}
              className="flex-1"
            >
              <Image className="mr-2 h-4 w-4" />
              Upload Image
            </Button>
            <Button
              type="button"
              variant={inputMode === "text" ? "default" : "outline"}
              onClick={() => handleModeChange("text")}
              disabled={isAnalyzing}
              className="flex-1"
            >
              <FileText className="mr-2 h-4 w-4" />
              Paste Text
            </Button>
          </div>

          {/* Image upload mode */}
          {inputMode === "image" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="screenshot">Screenshot</Label>
                <Input
                  id="screenshot"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  disabled={isAnalyzing}
                />
              </div>

              {preview && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="relative w-full border rounded-lg overflow-hidden">
                    <img
                      src={preview}
                      alt="Screenshot preview"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Text input mode */}
          {inputMode === "text" && (
            <div className="space-y-2">
              <Label htmlFor="conversation-text">Conversation Text</Label>
              <Textarea
                id="conversation-text"
                placeholder="Paste or type the conversation text here..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                disabled={isAnalyzing}
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Paste the conversation text including usernames/names and messages
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm whitespace-pre-line">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleAnalyze}
              disabled={
                isAnalyzing ||
                (inputMode === "image" && !file) ||
                (inputMode === "text" && !textContent.trim())
              }
              className="flex-1"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Analyze {inputMode === "image" ? "Screenshot" : "Text"}
                </>
              )}
            </Button>
            {(file || textContent) && (
              <Button
                onClick={handleReset}
                variant="outline"
                disabled={isAnalyzing}
              >
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {analysis && <AnalysisResults analysis={analysis} />}
    </div>
  );
}

