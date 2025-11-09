"use server";

import { z } from "zod";

const AnalysisSchema = z.object({
  wrong: z.array(z.string()).describe("List of people who were wrong in the conversation"),
  unsolicitedAdvice: z.array(z.string()).describe("List of people who gave unsolicited advice"),
  rude: z.array(z.string()).describe("List of people who were being rude"),
  summary: z.string().describe("A brief summary of the conversation analysis"),
});

export type AnalysisResult = z.infer<typeof AnalysisSchema>;

async function makeAnalysisRequest(
  apiBaseURL: string,
  apiKey: string,
  apiModel: string,
  imageBase64: string | null,
  mimeType: string | null,
  textContent: string | null,
  useJsonSchema: boolean,
  retryCount = 0
): Promise<AnalysisResult> {
  const maxRetries = 3;
  const baseDelay = 2000; // 2 seconds

  try {
    // Build the request payload - compatible with OpenAI-compatible APIs
    const requestBody: any = {
      model: apiModel,
      messages: [
        {
          role: "system",
          content: `You are an expert at analyzing conversations from screenshots or text in any language. Your task is to:
1. Identify who was wrong in the conversation
2. Identify who gave unsolicited advice
3. Identify who was being rude

Analyze the conversation carefully and extract all the messages, regardless of the language used (English, Spanish, French, German, Chinese, Japanese, Arabic, Russian, Portuguese, Italian, Korean, Hindi, or any other language). Identify each participant by their name or username. Be fair and objective in your analysis. Understand cultural context and language nuances when determining if someone was wrong, gave unsolicited advice, or was being rude.`,
        },
        {
          role: "user",
          content: (() => {
            const basePrompt = useJsonSchema
              ? `Analyze this conversation (which may be in any language). Identify:
1. Who was wrong (if anyone)
2. Who gave unsolicited advice (if anyone)
3. Who was being rude (if anyone)

Provide a structured analysis with the names/usernames of people in each category. If no one fits a category, return an empty array for that category. The summary should be in the same language as the conversation, or in English if the conversation uses multiple languages.`
              : `Analyze this conversation (which may be in any language). Identify:
1. Who was wrong (if anyone)
2. Who gave unsolicited advice (if anyone)
3. Who was being rude (if anyone)

Respond with a valid JSON object in this exact format:
{
  "wrong": ["name1", "name2"],
  "unsolicitedAdvice": ["name3"],
  "rude": ["name4"],
  "summary": "Brief summary of the conversation analysis"
}

If no one fits a category, use an empty array []. The summary should be in the same language as the conversation, or in English if the conversation uses multiple languages.`;

            if (textContent) {
              // Text-only analysis
              return [
                {
                  type: "text",
                  text: `${basePrompt}\n\nConversation text:\n${textContent}`,
                },
              ];
            } else if (imageBase64 && mimeType) {
              // Image analysis
              return [
                {
                  type: "text",
                  text: `Analyze this screenshot of a conversation. ${basePrompt}`,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${imageBase64}`,
                  },
                },
              ];
            } else {
              throw new Error("Either text content or image must be provided");
            }
          })(),
        },
      ],
      temperature: 0.3,
    };

    // Only add response_format if the provider supports it
    if (useJsonSchema) {
      requestBody.response_format = {
        type: "json_schema",
        json_schema: {
          name: "conversation_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              wrong: {
                type: "array",
                items: { type: "string" },
                description: "List of people who were wrong in the conversation",
              },
              unsolicitedAdvice: {
                type: "array",
                items: { type: "string" },
                description: "List of people who gave unsolicited advice",
              },
              rude: {
                type: "array",
                items: { type: "string" },
                description: "List of people who were being rude",
              },
              summary: {
                type: "string",
                description: "A brief summary of the conversation analysis",
              },
            },
            required: ["wrong", "unsolicitedAdvice", "rude", "summary"],
            additionalProperties: false,
          },
        },
      };
    }

    // Determine the endpoint URL
    const endpoint = apiBaseURL.endsWith("/")
      ? `${apiBaseURL}chat/completions`
      : `${apiBaseURL}/chat/completions`;

    // Make the API request
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorData: any = {};
      try {
        const text = await response.text();
        errorData = text ? JSON.parse(text) : {};
      } catch {
        // If parsing fails, use empty object
      }
      
      const errorMessage = 
        errorData.error?.message || 
        errorData.message || 
        errorData.error || 
        response.statusText ||
        `HTTP ${response.status}`;
      
      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        errorData,
        endpoint,
      });
      
      throw {
        status: response.status,
        message: errorMessage,
        fullError: errorData,
      };
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response content from API");
    }

    // If not using json_schema, the content might be a string that needs parsing
    let parsed: any;
    if (typeof content === "string") {
      try {
        parsed = JSON.parse(content);
      } catch {
        // If parsing fails, try to extract JSON from the text
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Could not parse JSON from API response");
        }
      }
    } else {
      parsed = content;
    }

    return AnalysisSchema.parse(parsed);
  } catch (error) {
    console.error("Error analyzing screenshot:", error);
    
    // Handle rate limit errors with retry logic
    if (error && typeof error === "object" && "status" in error) {
      const apiError = error as { status?: number; message?: string };
      
      // Retry on rate limit errors
      if (apiError.status === 429 && retryCount < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
        console.log(`Rate limit hit. Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return makeAnalysisRequest(apiBaseURL, apiKey, apiModel, imageBase64, mimeType, textContent, useJsonSchema, retryCount + 1);
      }
      
      if (apiError.status === 401) {
        throw new Error(
          "Invalid API key (401 Unauthorized). This means:\n" +
          "• The API key is invalid or expired\n" +
          "• The API key was revoked\n" +
          "• The API key doesn't have the right permissions\n\n" +
          "Please:\n" +
          "1. Verify your API key is correct in .env.local\n" +
          "2. Make sure the key is complete (not truncated)\n" +
          "3. Check that your API provider account is active\n" +
          "4. Update .env.local with the correct key (no quotes, no spaces)\n" +
          "5. Restart the server (stop with Cmd+C, then run 'pnpm dev')"
        );
      } else if (apiError.status === 429) {
        throw new Error(
          "Rate limit exceeded. This usually means:\n" +
          "• You've made too many requests in a short time (wait a few minutes)\n" +
          "• Your OpenAI account has hit its usage limit\n" +
          "• You're on a free tier with limited requests\n\n" +
          "Please check your OpenAI account at https://platform.openai.com/usage or add billing information."
        );
      } else if (apiError.status === 400) {
        const errorMsg = apiError.message || "Invalid request";
        throw new Error(
          `Invalid request (400 Bad Request): ${errorMsg}\n\n` +
          "This could mean:\n" +
          "• The image format is not supported by your API provider\n" +
          "• The request format is incompatible with your API provider\n" +
          "• The model doesn't support vision/image inputs\n" +
          "• The response_format (JSON schema) is not supported\n\n" +
          "Check the server console for more details."
        );
      } else if (apiError.status === 404) {
        throw new Error("API endpoint not found. Please check your API_BASE_URL in .env.local");
      } else if (apiError.message) {
        const fullError = (apiError as any).fullError;
        const errorDetails = fullError ? `\n\nDetails: ${JSON.stringify(fullError, null, 2)}` : "";
        throw new Error(`API error (${apiError.status}): ${apiError.message}${errorDetails}`);
      }
    }
    
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid response format: ${error.message}`);
    }
    
    if (error instanceof Error) {
      // If it's already a user-friendly error, pass it through
      if (error.message.includes("OPENAI_API_KEY") || error.message.includes("API key")) {
        throw error;
      }
      // Check for common API error messages
      if (error.message.includes("401") || error.message.includes("Unauthorized")) {
        throw new Error("Invalid API key. Please check your API key in .env.local");
      }
      if (error.message.includes("429") || error.message.includes("rate limit")) {
        if (retryCount < maxRetries) {
          const delay = baseDelay * Math.pow(2, retryCount);
          console.log(`Rate limit hit. Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return makeAnalysisRequest(apiBaseURL, apiKey, apiModel, imageBase64, mimeType, textContent, useJsonSchema, retryCount + 1);
        }
        throw new Error(
          "Rate limit exceeded. This usually means:\n" +
          "• You've made too many requests in a short time (wait a few minutes)\n" +
          "• Your API account has hit its usage limit\n" +
          "• You're on a free tier with limited requests\n\n" +
          "Please check your API provider account or add billing information."
        );
      }
      throw new Error(`Analysis failed: ${error.message}`);
    }
    
    throw new Error("Failed to analyze screenshot. Please try again.");
  }
}

export async function analyzeScreenshot(
  imageBase64: string | null = null,
  mimeType: string | null = null
): Promise<AnalysisResult> {
  return analyzeConversation(null, imageBase64, mimeType);
}

export async function analyzeText(
  textContent: string
): Promise<AnalysisResult> {
  return analyzeConversation(textContent, null, null);
}

async function analyzeConversation(
  textContent: string | null,
  imageBase64: string | null = null,
  mimeType: string | null = null
): Promise<AnalysisResult> {
  const apiKey = process.env.API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
  const apiBaseURL = process.env.API_BASE_URL?.trim() || "https://api.openai.com/v1";
  const apiModel = process.env.API_MODEL?.trim() || "gpt-4o";
  const useJsonSchema = process.env.USE_JSON_SCHEMA?.trim() !== "false"; // Default to true

  if (!apiKey) {
    throw new Error(
      "API_KEY or OPENAI_API_KEY is not set in .env.local. Please add your API key and restart the server."
    );
  }

  if (!apiBaseURL) {
    throw new Error(
      "API_BASE_URL is not set in .env.local. Please add your API provider's base URL and restart the server."
    );
  }

  if (!textContent && !imageBase64) {
    throw new Error("Either text content or image must be provided");
  }

  return makeAnalysisRequest(apiBaseURL, apiKey, apiModel, imageBase64, mimeType, textContent, useJsonSchema);
}

