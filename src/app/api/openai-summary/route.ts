import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const { context, maxWords } = await req.json();

    // Initialize OpenAI client lazily to prevent build-time errors
    // and support both Azure and standard OpenAI
    const apiKey = process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY;
    const baseURL = process.env.AZURE_OPENAI_ENDPOINT 
      ? `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`
      : undefined;
      
    if (!apiKey) {
      console.error("❌ Missing OpenAI API Key");
      return NextResponse.json(
        { error: "Server misconfiguration: Missing API Key" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL,
      defaultQuery: baseURL ? { "api-version": "2024-02-15-preview" } : undefined,
      defaultHeaders: baseURL ? { "api-key": apiKey } : undefined,
    });

    if (!context) {
      return NextResponse.json(
        { error: "Context is required" },
        { status: 400 }
      );
    }

    const prompt = `You are a medical summarization assistant. Summarize the following treatment history information in a clear, concise manner. Keep the summary under ${
      maxWords || 300
    } words. Focus on the most important diagnoses, treatments, and clinical findings across all body parts. No self generated content—only summarize what is provided. No patient identifiers or personal information. No fabrication.

Treatment History Data:
${context}

Provide a professional medical summary that a physician can quickly review.`;

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a medical summarization expert. Provide concise, accurate summaries of treatment histories. donot include patient identifiers or personal information.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: true,
      max_tokens: 500,
      temperature: 0.3,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              const data = `data: ${JSON.stringify(chunk)}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
