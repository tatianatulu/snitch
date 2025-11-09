"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type AnalysisResult } from "@/app/actions/analyze";
import { AlertCircle, MessageSquare, ThumbsDown, UserX } from "lucide-react";

interface AnalysisResultsProps {
  analysis: AnalysisResult;
}

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{analysis.summary}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ThumbsDown className="h-4 w-4 text-destructive" />
              Who Was Wrong
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.wrong.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {analysis.wrong.map((person, index) => (
                  <Badge key={index} variant="destructive">
                    {person}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No one was identified as being wrong.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              Unsolicited Advice
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.unsolicitedAdvice.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {analysis.unsolicitedAdvice.map((person, index) => (
                  <Badge key={index} variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    {person}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No unsolicited advice was identified.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserX className="h-4 w-4 text-orange-600" />
              Who Was Rude
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.rude.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {analysis.rude.map((person, index) => (
                  <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    {person}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No rude behavior was identified.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

