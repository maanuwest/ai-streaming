/**
 * Stream decoder utility for parsing Server-Sent Events (SSE) from OpenAI API
 */

export interface StreamChunk {
  content?: string;
  done?: boolean;
}

/**
 * Decodes a streaming response from OpenAI's chat completion API
 *
 * @param reader - ReadableStream reader from fetch response
 * @returns AsyncIterable that yields content chunks
 *
 * @example
 * ```typescript
 * const reader = response.body?.getReader();
 * if (!reader) throw new Error("No reader");
 *
 * for await (const chunk of decodeStreamResponse(reader)) {
 *   if (chunk.content) {
 *     console.log(chunk.content);
 *   }
 * }
 * ```
 */
export async function* decodeStreamResponse(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncGenerator<StreamChunk> {
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        yield { done: true };
        break;
      }

      // Decode bytes to text and append to buffer
      buffer += decoder.decode(value, { stream: true });

      // Split by newlines to process complete lines
      const lines = buffer.split("\n");

      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || "";

      // Process each complete line
      for (const line of lines) {
        // SSE format: "data: {json}\n\n"
        if (line.startsWith("data: ")) {
          const data = line.slice(6); // Remove "data: " prefix

          // OpenAI sends "[DONE]" when stream is complete
          if (data === "[DONE]") {
            yield { done: true };
            continue;
          }

          try {
            // Parse the JSON payload
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;

            // Yield the content token if present
            if (content) {
              yield { content };
            }
          } catch (error) {
            // Skip invalid JSON chunks
            console.error("Failed to parse SSE chunk:", error);
            console.debug("Problematic data:", data);
          }
        }
      }
    }
  } finally {
    // Ensure reader is released
    reader.releaseLock();
  }
}

/**
 * Helper function to consume an entire stream and return the full text
 * Useful for non-streaming use cases or testing
 *
 * @param reader - ReadableStream reader from fetch response
 * @returns Promise with the complete text content
 */
export async function consumeStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): Promise<string> {
  let fullContent = "";

  for await (const chunk of decodeStreamResponse(reader)) {
    if (chunk.content) {
      fullContent += chunk.content;
    }
  }

  return fullContent;
}
